"""
Generates 6 realistic, deliberately varied "messy" sample invoices for the
document-ai extraction demo. Varied vendors, layouts, and formatting quality
on purpose -- a uniform template set would prove nothing about real-world
extraction robustness. Invoice #2 has a genuine subtotal+tax != total error
baked into the printed numbers, to prove the app's validation rule catches
a real invoice mistake, not just an OCR slip.
"""
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

W, H = letter


def line_items_total(items):
    return sum(q * p for _, q, p, _ in items)


def draw_wrapped(c, text, x, y, font="Helvetica", size=9, max_width=470):
    c.setFont(font, size)
    words = text.split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, font, size) > max_width:
            c.drawString(x, y, line)
            y -= size + 2
            line = w
        else:
            line = test
    if line:
        c.drawString(x, y, line)
    return y - size - 2


# ---------------------------------------------------------------- invoice 1
def invoice_summit_office():
    c = canvas.Canvas("01_summit_office_supplies.pdf", pagesize=letter)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(1 * inch, H - 1 * inch, "Summit Office Supplies")
    c.setFont("Helvetica", 9)
    c.drawString(1 * inch, H - 1.2 * inch, "4410 Ridgeway Ave, Suite 200, Denver, CO 80202")
    c.drawString(1 * inch, H - 1.35 * inch, "billing@summitofficesupplies.com  |  (303) 555-0148")

    c.setFont("Helvetica-Bold", 13)
    c.drawRightString(7.5 * inch, H - 1 * inch, "INVOICE")
    c.setFont("Helvetica", 10)
    c.drawRightString(7.5 * inch, H - 1.25 * inch, "Invoice #: INV-20482")
    c.drawRightString(7.5 * inch, H - 1.4 * inch, "Invoice Date: 2026-06-14")
    c.drawRightString(7.5 * inch, H - 1.55 * inch, "Due Date: 2026-07-14")

    c.setFont("Helvetica-Bold", 10)
    c.drawString(1 * inch, H - 2.1 * inch, "Bill To: Northwind Outdoors, Attn: Accounts Payable")

    items = [
        ("Copy paper, 20lb, case of 10 reams", 8, 42.00, "each"),
        ("Standing desk converter", 3, 189.00, "each"),
        ("Toner cartridge, black (HP compatible)", 6, 34.50, "each"),
        ("Ergonomic office chair", 2, 245.00, "each"),
    ]
    y = H - 2.6 * inch
    c.setFont("Helvetica-Bold", 9)
    c.drawString(1 * inch, y, "Description")
    c.drawString(5.1 * inch, y, "Qty")
    c.drawString(5.7 * inch, y, "Unit Price")
    c.drawString(6.7 * inch, y, "Total")
    y -= 16
    c.line(1 * inch, y + 4, 7.5 * inch, y + 4)
    c.setFont("Helvetica", 9)
    subtotal = 0
    for desc, qty, price, _ in items:
        c.drawString(1 * inch, y, desc)
        c.drawString(5.15 * inch, y, str(qty))
        c.drawString(5.7 * inch, y, f"${price:,.2f}")
        c.drawString(6.7 * inch, y, f"${qty * price:,.2f}")
        subtotal += qty * price
        y -= 18

    tax = round(subtotal * 0.0781, 2)
    total = round(subtotal + tax, 2)
    y -= 10
    c.line(5 * inch, y + 4, 7.5 * inch, y + 4)
    c.setFont("Helvetica", 9)
    c.drawString(5.7 * inch, y, "Subtotal")
    c.drawRightString(7.5 * inch, y, f"${subtotal:,.2f}")
    y -= 16
    c.drawString(5.7 * inch, y, "Sales Tax (7.81%)")
    c.drawRightString(7.5 * inch, y, f"${tax:,.2f}")
    y -= 18
    c.setFont("Helvetica-Bold", 10)
    c.drawString(5.7 * inch, y, "Total Due")
    c.drawRightString(7.5 * inch, y, f"${total:,.2f}")

    c.setFont("Helvetica-Oblique", 8)
    c.drawString(1 * inch, 1 * inch, "Thank you for your business. Payment due within 30 days.")
    c.save()


# ---------------------------------------------------------------- invoice 2
def invoice_ridgeline_logistics():
    c = canvas.Canvas("02_ridgeline_logistics.pdf", pagesize=letter)
    c.setFillColorRGB(0.15, 0.15, 0.2)
    c.rect(0, H - 1.5 * inch, W, 1.5 * inch, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(0.75 * inch, H - 0.9 * inch, "RIDGELINE LOGISTICS CO.")
    c.setFont("Helvetica", 9)
    c.drawString(0.75 * inch, H - 1.15 * inch, "Freight & Warehousing  |  ap@ridgelinelogistics.net")

    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.75 * inch, H - 1.9 * inch, "Invoice No. RL-77291")
    c.setFont("Helvetica", 10)
    c.drawString(0.75 * inch, H - 2.1 * inch, "Invoice Date: 2026-05-02")
    c.drawString(0.75 * inch, H - 2.28 * inch, "Payment Due: 2026-06-01")
    c.drawString(0.75 * inch, H - 2.55 * inch, "Billed to: Northwind Outdoors")

    items = [
        ("Freight - pallet shipment (Denver to Seattle)", 1, 1120.00, "flat"),
        ("Warehousing, June (per pallet/month)", 4, 30.00, "each"),
    ]
    y = H - 3.1 * inch
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.75 * inch, y, "Service")
    c.drawString(4.8 * inch, y, "Qty")
    c.drawString(5.4 * inch, y, "Rate")
    c.drawString(6.5 * inch, y, "Amount")
    y -= 16
    c.setFont("Helvetica", 9)
    subtotal = 0
    for desc, qty, price, _ in items:
        c.drawString(0.75 * inch, y, desc)
        c.drawString(4.85 * inch, y, str(qty))
        c.drawString(5.4 * inch, y, f"${price:,.2f}")
        c.drawString(6.5 * inch, y, f"${qty * price:,.2f}")
        subtotal += qty * price
        y -= 18

    tax = round(subtotal * 0.08, 2)
    # Deliberate real-world invoice error: printed total does not equal
    # subtotal + tax. This is intentional -- it's what the app's validation
    # rule is supposed to catch, independent of how confident the model is
    # about having read the digits correctly.
    wrong_total = round(subtotal + tax, 2) + 10.80
    y -= 14
    c.setFont("Helvetica", 9)
    c.drawString(5.4 * inch, y, "Subtotal")
    c.drawRightString(7.4 * inch, y, f"${subtotal:,.2f}")
    y -= 16
    c.drawString(5.4 * inch, y, "Tax (8%)")
    c.drawRightString(7.4 * inch, y, f"${tax:,.2f}")
    y -= 18
    c.setFont("Helvetica-Bold", 11)
    c.drawString(5.4 * inch, y, "TOTAL DUE")
    c.drawRightString(7.4 * inch, y, f"${wrong_total:,.2f}")

    c.setFont("Helvetica", 8)
    c.drawString(0.75 * inch, 1 * inch, "Net 30. Late payments subject to 1.5% monthly fee.")
    c.save()


# ---------------------------------------------------------------- invoice 3
def invoice_blackstone_industrial():
    c = canvas.Canvas("03_blackstone_industrial.pdf", pagesize=letter)
    # Dense, cramped, small-font layout on purpose.
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.6 * inch, H - 0.6 * inch, "BLACKSTONE INDUSTRIAL PARTS SUPPLY INC.")
    c.setFont("Helvetica", 7)
    c.drawString(0.6 * inch, H - 0.75 * inch, "1188 Foundry Rd, Pittsburgh PA 15201 | Tax ID 25-1194823 | orders@blackstoneparts.biz | fax 412-555-0199")
    c.line(0.6 * inch, H - 0.85 * inch, 7.9 * inch, H - 0.85 * inch)

    c.setFont("Helvetica", 8)
    c.drawString(0.6 * inch, H - 1.05 * inch, "INV#: BIP-449213-A   DATE: 06/29/2026   TERMS: NET30   DUE: 07/29/2026   PO#: NW-3387")
    c.drawString(0.6 * inch, H - 1.2 * inch, "SOLD TO: Northwind Outdoors / AP Dept")

    items = [
        ("Hex bolt, 3/8-16 x 2in, zinc plated, box/100", 12, 8.75),
        ("Steel angle bracket, 4x4x1/4", 40, 3.10),
        ("Industrial caster wheel, 5in swivel", 16, 11.40),
        ("Nylon washer assortment kit", 5, 14.20),
        ("Threaded rod, 1/2-13 x 36in", 20, 6.65),
        ("Safety wire, 0.032in, 1lb spool", 10, 9.90),
    ]
    y = H - 1.5 * inch
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(0.6 * inch, y, "ITEM DESCRIPTION")
    c.drawString(5.3 * inch, y, "QTY")
    c.drawString(5.9 * inch, y, "UNIT")
    c.drawString(6.6 * inch, y, "EXT")
    y -= 11
    c.setFont("Helvetica", 7.5)
    subtotal = 0
    for desc, qty, price in items:
        c.drawString(0.6 * inch, y, desc)
        c.drawString(5.3 * inch, y, str(qty))
        c.drawString(5.9 * inch, y, f"{price:.2f}")
        c.drawString(6.6 * inch, y, f"{qty * price:.2f}")
        subtotal += qty * price
        y -= 10.5

    tax = round(subtotal * 0.06, 2)
    total = round(subtotal + tax, 2)
    y -= 8
    c.setFont("Helvetica", 7.5)
    c.drawString(5.9 * inch, y, f"SUBTOTAL: {subtotal:.2f}")
    y -= 10
    c.drawString(5.9 * inch, y, f"TAX 6%: {tax:.2f}")
    y -= 12
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(5.9 * inch, y, f"TOTAL: {total:.2f}")
    c.setFont("Helvetica", 6.5)
    c.drawString(0.6 * inch, 0.7 * inch, "Returns accepted within 15 days with RMA number only. Restocking fee 15%. See reverse for full terms.")
    c.save()


# ---------------------------------------------------------------- invoice 4
def invoice_marias_catering():
    c = canvas.Canvas("04_marias_catering.pdf", pagesize=letter)
    c.setFont("Helvetica-BoldOblique", 24)
    c.drawCentredString(W / 2, H - 1.1 * inch, "Maria's Catering & Events")
    c.setFont("Helvetica-Oblique", 10)
    c.drawCentredString(W / 2, H - 1.35 * inch, "\"Good food, good company\"")
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, H - 1.55 * inch, "512 Elm Street, Boulder CO 80301  -  (720) 555-0173  -  maria@mariascatering.com")

    # Informal, slightly off-grid layout, invoice number stamped sideways-ish.
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1 * inch, H - 2.2 * inch, "Invoice for: Northwind Outdoors (office lunch, staff event)")
    c.setFont("Helvetica", 9)
    c.drawString(1 * inch, H - 2.4 * inch, "Date of event: June 3, 2026")
    c.drawString(1 * inch, H - 2.58 * inch, "Invoice #: 0119")
    c.drawString(1 * inch, H - 2.76 * inch, "Please pay by: June 20, 2026")

    items = [
        ("Taco bar catering, 25 people", 1, 425.00),
        ("Beverage service (soda + water)", 1, 60.00),
        ("Delivery & setup fee", 1, 45.00),
    ]
    y = H - 3.3 * inch
    c.setFont("Helvetica", 9)
    subtotal = 0
    for desc, qty, price in items:
        c.drawString(1.2 * inch, y, f"- {desc} .......... ${price:,.2f}")
        subtotal += qty * price
        y -= 20

    tax = round(subtotal * 0.048, 2)
    total = round(subtotal + tax, 2)
    y -= 10
    c.line(1 * inch, y + 6, 4.5 * inch, y + 6)
    c.drawString(1 * inch, y, f"Subtotal: ${subtotal:,.2f}")
    y -= 18
    c.drawString(1 * inch, y, f"Tax: ${tax:,.2f}")
    y -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(1 * inch, y, f"Amount Due: ${total:,.2f}")

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(1 * inch, 1.2 * inch, "Thanks so much for having us cater your event -- hope everyone enjoyed it!")
    c.drawString(1 * inch, 1 * inch, "Venmo @marias-catering or check payable to Maria Alvarez.")
    c.save()


# ---------------------------------------------------------------- invoice 5
def invoice_apex_construction():
    c = canvas.Canvas("05_apex_construction.pdf", pagesize=letter)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(0.75 * inch, H - 0.9 * inch, "Apex Construction Materials LLC")
    c.setFont("Helvetica", 9)
    c.drawString(0.75 * inch, H - 1.1 * inch, "2200 Industrial Pkwy, Salt Lake City, UT 84104")
    c.drawString(0.75 * inch, H - 1.25 * inch, "accounting@apexconstructionmaterials.com")

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(7.75 * inch, H - 0.9 * inch, "Invoice # AP-100562")
    c.setFont("Helvetica", 9)
    c.drawRightString(7.75 * inch, H - 1.1 * inch, "Invoice Date: 2026-07-08")
    c.drawRightString(7.75 * inch, H - 1.25 * inch, "Due Date: 2026-08-07")
    c.drawRightString(7.75 * inch, H - 1.4 * inch, "Job Site: Northwind Outdoors - Warehouse Expansion")

    items = [
        ("Ready-mix concrete, 4000 PSI (cubic yard)", 22, 165.00),
        ("Rebar, #4 grade 60, 20ft length", 150, 9.85),
        ("Structural steel beam, W8x18, 20ft", 6, 410.00),
        ("Gravel base material (ton)", 30, 28.50),
        ("Concrete form rental (weekly)", 3, 95.00),
    ]
    y = H - 2 * inch
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.75 * inch, y, "Material / Service")
    c.drawString(5.2 * inch, y, "Qty")
    c.drawString(5.8 * inch, y, "Unit Price")
    c.drawString(6.9 * inch, y, "Total")
    y -= 16
    c.line(0.75 * inch, y + 4, 7.75 * inch, y + 4)
    c.setFont("Helvetica", 9)
    subtotal = 0
    for desc, qty, price in items:
        c.drawString(0.75 * inch, y, desc)
        c.drawString(5.25 * inch, y, str(qty))
        c.drawString(5.8 * inch, y, f"${price:,.2f}")
        c.drawString(6.9 * inch, y, f"${qty * price:,.2f}")
        subtotal += qty * price
        y -= 18

    state_tax = round(subtotal * 0.0485, 2)
    local_tax = round(subtotal * 0.015, 2)
    total = round(subtotal + state_tax + local_tax, 2)
    y -= 10
    c.line(5.1 * inch, y + 4, 7.75 * inch, y + 4)
    c.setFont("Helvetica", 9)
    c.drawString(5.8 * inch, y, "Subtotal")
    c.drawRightString(7.75 * inch, y, f"${subtotal:,.2f}")
    y -= 16
    c.drawString(5.8 * inch, y, "UT State Tax (4.85%)")
    c.drawRightString(7.75 * inch, y, f"${state_tax:,.2f}")
    y -= 16
    c.drawString(5.8 * inch, y, "Local Tax (1.5%)")
    c.drawRightString(7.75 * inch, y, f"${local_tax:,.2f}")
    y -= 18
    c.setFont("Helvetica-Bold", 10)
    c.drawString(5.8 * inch, y, "Total Due")
    c.drawRightString(7.75 * inch, y, f"${total:,.2f}")

    c.setFont("Helvetica-Oblique", 8)
    c.drawString(0.75 * inch, 1 * inch, "Note: combined tax line above should be treated as a single 'tax' figure for AP purposes.")
    c.save()


# ---------------------------------------------------------------- invoice 6
def invoice_coastal_freight():
    c = canvas.Canvas("06_coastal_freight.pdf", pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(0.9 * inch, H - 1 * inch, "Coastal Freight Solutions")
    c.setFont("Helvetica", 9)
    c.drawString(0.9 * inch, H - 1.2 * inch, "Port of Long Beach Terminal 4  |  billing@coastalfreightsolutions.com")

    # No due date printed anywhere on this invoice, on purpose.
    c.setFont("Helvetica", 10)
    c.drawString(0.9 * inch, H - 1.7 * inch, "Invoice Number: CF-8850")
    c.drawString(0.9 * inch, H - 1.9 * inch, "Date Issued: 2026-07-19")
    c.drawString(0.9 * inch, H - 2.1 * inch, "Customer: Northwind Outdoors")
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(0.9 * inch, H - 2.3 * inch, "Standard payment terms apply per master service agreement on file.")

    items = [
        ("Container drayage, Port to warehouse", 2, 340.00),
        ("Chassis rental (per day)", 4, 45.00),
        ("Fuel surcharge", 1, 88.00),
    ]
    y = H - 2.8 * inch
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.9 * inch, y, "Description")
    c.drawString(5.1 * inch, y, "Qty")
    c.drawString(5.7 * inch, y, "Rate")
    c.drawString(6.7 * inch, y, "Total")
    y -= 16
    c.setFont("Helvetica", 9)
    subtotal = 0
    for desc, qty, price in items:
        c.drawString(0.9 * inch, y, desc)
        c.drawString(5.15 * inch, y, str(qty))
        c.drawString(5.7 * inch, y, f"${price:,.2f}")
        c.drawString(6.7 * inch, y, f"${qty * price:,.2f}")
        subtotal += qty * price
        y -= 18

    tax = round(subtotal * 0.0725, 2)
    total = round(subtotal + tax, 2)
    y -= 10
    c.setFont("Helvetica", 9)
    c.drawString(5.7 * inch, y, "Subtotal")
    c.drawRightString(7.5 * inch, y, f"${subtotal:,.2f}")
    y -= 16
    c.drawString(5.7 * inch, y, "Tax")
    c.drawRightString(7.5 * inch, y, f"${tax:,.2f}")
    y -= 18
    c.setFont("Helvetica-Bold", 10)
    c.drawString(5.7 * inch, y, "Total")
    c.drawRightString(7.5 * inch, y, f"${total:,.2f}")
    c.save()


if __name__ == "__main__":
    invoice_summit_office()
    invoice_ridgeline_logistics()
    invoice_blackstone_industrial()
    invoice_marias_catering()
    invoice_apex_construction()
    invoice_coastal_freight()
    print("Generated 6 sample invoices.")
