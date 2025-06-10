import os
import sqlite3
import random
import string
from datetime import datetime
from django.utils import timezone
from django.db import transaction

def migrate_tickets(old_db_path, new_db_path):
    # Setup Django environment
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    import django
    django.setup()
    
    from tickets.models import Ticket, TicketType
    from core.models import Club  # Import Club model
    
    # Get the first club (assuming there's at least one club)
    try:
        club = Club.objects.first()
        if not club:
            raise ValueError("No clubs found in the database. Please create a club first.")
    except Exception as e:
        print(f"Error getting club: {e}")
        return

    # 1. Create default ticket types with club association
    ticket_types_mapping = {
        'day_pass': create_or_get_ticket_type('Day Pass', 100, club),
        'session': create_or_get_ticket_type('Session', 50, club)
    }
    
    # 2. Get old tickets data
    old_tickets = get_old_tickets(old_db_path)
    
    # 3. Migrate tickets
    with transaction.atomic():
        for old_ticket in old_tickets:
            try:
                migrate_single_ticket(old_ticket, ticket_types_mapping, club)
                print(f"Successfully migrated ticket ID {old_ticket['id']}")
            except Exception as e:
                print(f"Failed to migrate ticket ID {old_ticket.get('id', 'unknown')}: {str(e)}")

def create_or_get_ticket_type(name, default_price, club):
    from tickets.models import TicketType
    
    # Get or create ticket type with club association
    ticket_type, created = TicketType.objects.get_or_create(
        name=name,
        club=club,
        defaults={
            'price': default_price,
            'description': f"{name} ticket migrated from old system"
        }
    )
    if created:
        print(f"Created new ticket type: {name} for club {club.name}")
    return ticket_type

def get_old_tickets(db_path):
    """Retrieve ticket data from old database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            id, club_id, buyer_name, ticket_type, price, used, issue_date, used_by_id
        FROM tickets_ticket
    """)
    
    columns = [desc[0] for desc in cursor.description]
    tickets = []
    for row in cursor.fetchall():
        ticket_data = dict(zip(columns, row))
        # Convert SQLite date string to Python date object
        if ticket_data['issue_date']:
            ticket_data['issue_date'] = datetime.strptime(ticket_data['issue_date'], '%Y-%m-%d').date()
        tickets.append(ticket_data)
    
    conn.close()
    print(f"Found {len(tickets)} tickets in old database")
    return tickets

def migrate_single_ticket(old_ticket_data, ticket_types_mapping, club):
    from tickets.models import Ticket
    
    # Map old ticket type to new TicketType
    old_type = old_ticket_data['ticket_type']
    ticket_type = ticket_types_mapping.get(old_type)
    
    if not ticket_type:
        raise ValueError(f"Unknown ticket type: {old_type}")
    
    # Create datetime from date
    issue_datetime = timezone.make_aware(
        datetime.combine(
            old_ticket_data['issue_date'],
            datetime.min.time()
        )
    )
    
    # Generate unique serial number
    serial_number = generate_serial_number(old_ticket_data)
    
    # Create new ticket
    new_ticket = Ticket(
        club=club,  # Using the club we passed in
        ticket_type=ticket_type,
        notes=f"Original buyer: {old_ticket_data['buyer_name']}",
        price=old_ticket_data['price'],
        issue_datetime=issue_datetime,
        issued_by=None,  # You can set this to a specific user if needed
        serial_number=serial_number
    )
    
    # Save the new ticket
    new_ticket.save()

def generate_serial_number(ticket_data):
    """Generate unique serial number for ticket"""
    date_part = ticket_data['issue_date'].strftime('%Y%m%d')
    random_part = ''.join(random.choices(string.digits, k=3))
    return f"{date_part}-{random_part}"

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\club2\src\db_old.sqlite3"
    NEW_DB_PATH = r"F:\club\club2\src\db.sqlite3"
    
    migrate_tickets(OLD_DB_PATH, NEW_DB_PATH)