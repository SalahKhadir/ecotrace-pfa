# Generated by Django 5.2 on 2025-06-25 16:42

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.DeleteModel(
            name='NotificationTemplate',
        ),
        migrations.AlterModelOptions(
            name='notification',
            options={'ordering': ['-created_at']},
        ),
        migrations.RemoveIndex(
            model_name='notification',
            name='notificatio_recipie_a972ce_idx',
        ),
        migrations.RemoveIndex(
            model_name='notification',
            name='notificatio_recipie_4e3567_idx',
        ),
        migrations.RemoveIndex(
            model_name='notification',
            name='notificatio_type_ea918f_idx',
        ),
        migrations.RemoveIndex(
            model_name='notification',
            name='notificatio_priorit_bf8ea0_idx',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='is_read',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='metadata',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='recipient',
        ),
        migrations.AddField(
            model_name='notification',
            name='category',
            field=models.CharField(choices=[('collecte', 'Collecte'), ('demande', 'Demande'), ('utilisateur', 'Utilisateur'), ('system', 'Système'), ('valorisation', 'Valorisation'), ('planification', 'Planification'), ('validation', 'Validation')], default='system', max_length=20),
        ),
        migrations.AddField(
            model_name='notification',
            name='object_id',
            field=models.PositiveIntegerField(blank=True, help_text="ID de l'objet lié", null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='object_type',
            field=models.CharField(blank=True, help_text="Type d'objet lié (formulaire, collecte, etc.)", max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='read',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='notification',
            name='target_role',
            field=models.CharField(blank=True, choices=[('ADMINISTRATEUR', 'Administrateur'), ('TRANSPORTEUR', 'Transporteur'), ('TECHNICIEN', 'Technicien'), ('ENTREPRISE', 'Entreprise'), ('PARTICULIER', 'Particulier'), ('RESPONSABLE_LOGISTIQUE', 'Responsable Logistique')], help_text='Rôle cible pour notification globale', max_length=30, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='user',
            field=models.ForeignKey(blank=True, help_text='Utilisateur destinataire (si null, notification globale pour le rôle)', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='notification',
            name='action_url',
            field=models.CharField(blank=True, help_text="URL vers l'action à effectuer", max_length=500, null=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='message',
            field=models.TextField(help_text='Contenu de la notification'),
        ),
        migrations.AlterField(
            model_name='notification',
            name='priority',
            field=models.CharField(choices=[('low', 'Basse'), ('normal', 'Normale'), ('high', 'Haute'), ('urgent', 'Urgente')], default='normal', max_length=20),
        ),
        migrations.AlterField(
            model_name='notification',
            name='read_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(choices=[('info', 'Information'), ('success', 'Succès'), ('warning', 'Avertissement'), ('error', 'Erreur'), ('urgent', 'Urgent')], default='info', max_length=20),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'read'], name='notificatio_user_id_878a13_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['target_role', 'read'], name='notificatio_target__54d827_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['created_at'], name='notificatio_created_46ad24_idx'),
        ),
    ]
