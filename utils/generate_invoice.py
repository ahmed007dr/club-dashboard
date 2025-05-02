
from django.db.models import Max
from datetime import date

def generate_invoice_number(invoice_date=None):
    if invoice_date is None:
        invoice_date = date.today()

    year = str(invoice_date.year)[-2:]  
    month = str(invoice_date.month).zfill(2)  
    day = str(invoice_date.day).zfill(2)  

    from finance.models import Expense  
    prefix = f"{year}{month}{day}"
    last_invoice = Expense.objects.filter(invoice_number__startswith=prefix).aggregate(Max('invoice_number'))

    if last_invoice['invoice_number__max']:
        last_sequence = int(last_invoice['invoice_number__max'][-3:])
        if last_sequence >= 999:
            raise ValueError("Cannot generate invoice number: Maximum limit of 999 invoices per day reached.")
        sequence = str(last_sequence + 1).zfill(3)
    else:
        sequence = "001"

    return f"{prefix}{sequence}"
