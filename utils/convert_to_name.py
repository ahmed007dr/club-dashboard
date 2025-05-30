from django.db.models import Q

def get_object_from_id_or_name(model, value, fields=['id', 'name']):
    """
    Retrieve an object by ID or name. Returns None if not found or multiple results exist.
    """
    try:
        return model.objects.get(id=int(value))
    except (ValueError, model.DoesNotExist):
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__iexact": value})
        results = model.objects.filter(q)
        return results.first() if results.count() == 1 else None
