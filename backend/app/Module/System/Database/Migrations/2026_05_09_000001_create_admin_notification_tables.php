<?php

declare(strict_types=1);

use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_notification_batches', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('type', 64)->default('system');
            $table->string('level', 32)->default('info');
            $table->string('source', 64)->default('system');
            $table->json('targets')->nullable();
            $table->string('template_key', 128)->nullable();
            $table->json('template_variables')->nullable();
            $table->string('fallback_title', 255)->nullable();
            $table->text('fallback_content')->nullable();
            $table->json('payload')->nullable();
            $table->json('attachments')->nullable();
            $table->string('target_url', 512)->nullable();
            $table->string('dedupe_key', 191)->nullable();
            $table->integer('dedupe_ttl_seconds')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('status', 32)->default('completed');
            $table->string('operator_type', 32)->default('admin');
            $table->unsignedBigInteger('operator_id')->nullable();
            $table->string('operator_name', 64)->default('');
            $table->unsignedBigInteger('impersonator_id')->nullable();
            $table->string('error_message', 512)->nullable();
            $table->datetimes();

            $table->index(['status', 'created_at']);
            $table->index(['source', 'type']);
            $table->index(['dedupe_key']);
        });

        Schema::create('admin_notification_deliveries', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('batch_id');
            $table->unsignedBigInteger('receiver_id');
            $table->string('receiver_name', 64)->default('');
            $table->string('locale', 32)->default('zh_CN');
            $table->string('title', 255);
            $table->text('content')->nullable();
            $table->json('payload')->nullable();
            $table->json('attachments')->nullable();
            $table->string('target_url', 512)->nullable();
            $table->string('status', 32)->default('pending');
            $table->string('skip_reason', 64)->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('error_message', 512)->nullable();
            $table->integer('retry_count')->default(0);
            $table->datetimes();

            $table->unique(['batch_id', 'receiver_id']);
            $table->index(['receiver_id', 'archived_at']);
            $table->index(['receiver_id', 'read_at']);
            $table->index(['batch_id', 'status']);
            $table->index(['receiver_id', 'expires_at']);
        });

        Schema::create('admin_announcements', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('title', 255);
            $table->text('content')->nullable();
            $table->string('level', 32)->default('info');
            $table->string('type', 64)->default('announcement');
            $table->string('source', 64)->default('system');
            $table->string('scope', 32)->default('all');
            $table->json('role_ids')->nullable();
            $table->json('payload')->nullable();
            $table->json('attachments')->nullable();
            $table->string('target_url', 512)->nullable();
            $table->string('status', 32)->default('draft');
            $table->boolean('pinned')->default(false);
            $table->timestamp('publish_at')->nullable();
            $table->timestamp('expire_at')->nullable();
            $table->string('operator_type', 32)->default('admin');
            $table->unsignedBigInteger('operator_id')->nullable();
            $table->string('operator_name', 64)->default('');
            $table->datetimes();

            $table->index(['status', 'publish_at']);
            $table->index(['source', 'type']);
            $table->index(['pinned', 'publish_at']);
        });

        Schema::create('admin_announcement_reads', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('announcement_id');
            $table->unsignedBigInteger('admin_id');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->datetimes();

            $table->unique(['announcement_id', 'admin_id']);
            $table->index(['admin_id', 'archived_at']);
            $table->index(['admin_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_announcement_reads');
        Schema::dropIfExists('admin_announcements');
        Schema::dropIfExists('admin_notification_deliveries');
        Schema::dropIfExists('admin_notification_batches');
    }
};
