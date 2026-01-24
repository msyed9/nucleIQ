from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tenantbranding',
            name='icon_set',
            field=models.CharField(
                max_length=30,
                choices=[
                    ('lucide', 'Modern Line'),
                    ('heroicons_outline', 'Heroicons Outline'),
                    ('heroicons_solid', 'Heroicons Solid'),
                    ('phosphor_regular', 'Phosphor Regular'),
                    ('phosphor_bold', 'Phosphor Bold'),
                    ('phosphor_fill', 'Phosphor Fill'),
                    ('tabler', 'Tabler Icons'),
                    ('material_outlined', 'Material Outlined'),
                    ('bootstrap', 'Bootstrap Icons'),
                    ('remix', 'Remix Icons'),
                    ('boxicons_react', 'Boxicons (React)'),
                    ('fontawesome_react', 'Font Awesome (React)'),
                    ('game_icons', 'Game Icons'),
                    ('ionicons_react', 'Ionicons (React)'),
                    ('simple_icons_react', 'Simple Icons (React)'),
                    ('fun_neon', 'Fun Neon'),
                    ('fun_pastel', 'Playful Pastel'),
                    ('fun_cartoon', 'Cartoonish'),
                    ('fun_emoji', 'Emoji Style'),
                ],
                default='lucide',
                help_text='Icon library set for the tenant',
            ),
        ),
    ]
