from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptiontype',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
