from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from audit_trail.models import AuditLog, TimeStampedModel
from audit_trail.middleware import get_current_user

@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if not isinstance(instance, TimeStampedModel) or sender._meta.app_label == 'audit_trail':
        return

    user = get_current_user()
    action = 'create' if created else 'update'
    AuditLog.objects.create(
        action=action,
        app_name=sender._meta.app_label,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        description=str(instance),
        user=user
    )

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if not isinstance(instance, TimeStampedModel) or sender._meta.app_label == 'audit_trail':
        return

    user = get_current_user()
    AuditLog.objects.create(
        action='delete',
        app_name=sender._meta.app_label,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        description=str(instance),
        user=user
    )