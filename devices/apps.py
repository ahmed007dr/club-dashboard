from django.apps import AppConfig

class DevicesConfig(AppConfig):
    """
    App configuration for the devices application.
    Registers signals on app startup.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'devices'

    def ready(self):
        """
        Imports signals module to ensure signal handlers are registered.
        """
        import devices.signals