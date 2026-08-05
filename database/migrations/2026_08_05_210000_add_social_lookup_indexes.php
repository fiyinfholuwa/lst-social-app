<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('name', 'users_name_index');
        });

        Schema::table('communities', function (Blueprint $table) {
            $table->index('name', 'communities_name_index');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->index('created_at', 'posts_created_at_index');
            $table->index(['user_id', 'created_at'], 'posts_user_created_index');
            $table->index(['community_id', 'created_at'], 'posts_community_created_index');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->index(['post_id', 'created_at'], 'comments_post_created_index');
        });

        Schema::table('post_likes', function (Blueprint $table) {
            $table->index(['user_id', 'post_id'], 'post_likes_user_post_index');
        });

        Schema::table('saved_posts', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'saved_posts_user_created_index');
        });

        Schema::table('community_user', function (Blueprint $table) {
            $table->index(['user_id', 'community_id'], 'community_user_user_community_index');
        });

        Schema::table('community_applications', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'applications_user_status_index');
            $table->index(['community_id', 'status'], 'applications_community_status_index');
        });

        Schema::table('friendships', function (Blueprint $table) {
            $table->index(['sender_id', 'status'], 'friendships_sender_status_index');
            $table->index(['receiver_id', 'status'], 'friendships_receiver_status_index');
        });

        Schema::table('user_blocks', function (Blueprint $table) {
            $table->index(['blocked_user_id', 'user_id'], 'user_blocks_blocked_user_index');
        });

        Schema::table('chats', function (Blueprint $table) {
            $table->index('updated_at', 'chats_updated_at_index');
        });

        Schema::table('chat_user', function (Blueprint $table) {
            $table->index(['user_id', 'chat_id'], 'chat_user_user_chat_index');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['chat_id', 'created_at'], 'messages_chat_created_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'created_at'], 'notifications_user_created_index');
            $table->index(['user_id', 'read_at'], 'notifications_user_read_index');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_created_index');
            $table->dropIndex('notifications_user_read_index');
        });
        Schema::table('messages', fn (Blueprint $table) => $table->dropIndex('messages_chat_created_index'));
        Schema::table('chat_user', fn (Blueprint $table) => $table->dropIndex('chat_user_user_chat_index'));
        Schema::table('chats', fn (Blueprint $table) => $table->dropIndex('chats_updated_at_index'));
        Schema::table('user_blocks', fn (Blueprint $table) => $table->dropIndex('user_blocks_blocked_user_index'));
        Schema::table('friendships', function (Blueprint $table) {
            $table->dropIndex('friendships_sender_status_index');
            $table->dropIndex('friendships_receiver_status_index');
        });
        Schema::table('community_applications', function (Blueprint $table) {
            $table->dropIndex('applications_user_status_index');
            $table->dropIndex('applications_community_status_index');
        });
        Schema::table('community_user', fn (Blueprint $table) => $table->dropIndex('community_user_user_community_index'));
        Schema::table('saved_posts', fn (Blueprint $table) => $table->dropIndex('saved_posts_user_created_index'));
        Schema::table('post_likes', fn (Blueprint $table) => $table->dropIndex('post_likes_user_post_index'));
        Schema::table('comments', fn (Blueprint $table) => $table->dropIndex('comments_post_created_index'));
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_created_at_index');
            $table->dropIndex('posts_user_created_index');
            $table->dropIndex('posts_community_created_index');
        });
        Schema::table('communities', fn (Blueprint $table) => $table->dropIndex('communities_name_index'));
        Schema::table('users', fn (Blueprint $table) => $table->dropIndex('users_name_index'));
    }
};
