from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0003_add_icon_sets'),
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
                    ('boxicons', 'Boxicons'),
                    ('fontawesome_react', 'Font Awesome (React)'),
                    ('fontawesome_solid', 'Font Awesome (Solid)'),
                    ('fontawesome_regular', 'Font Awesome (Regular)'),
                    ('game_icons', 'Game Icons'),
                    ('ionicons_react', 'Ionicons (React)'),
                    ('ionicons', 'Ionicons'),
                    ('simple_icons_react', 'Simple Icons (React)'),
                    ('simple_icons', 'Simple Icons'),
                    ('ant_design', 'Ant Design'),
                    ('feather', 'Feather Icons'),
                    ('eva_icons', 'Eva Icons'),
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
