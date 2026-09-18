<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $emojis = [
            'happy-outline' => '😀', 'happy' => '😄', 'heart' => '❤️', 'heart-outline' => '💖',
            'thumbs-up' => '👍', 'thumbs-down' => '👎', 'hand-left-outline' => '👋',
            'star-outline' => '✨', 'star' => '⭐', 'sunny-outline' => '☀️', 'moon-outline' => '🌙',
            'rainy-outline' => '🌧️', 'flower-outline' => '🌸', 'leaf-outline' => '🌿',
            'flame-outline' => '🔥', 'water-outline' => '💧', 'chatbubble-outline' => '💬',
            'mail-outline' => '✉️', 'gift-outline' => '🎁', 'color-palette-outline' => '🎈',
            'musical-notes-outline' => '🎵', 'camera-outline' => '📷', 'images-outline' => '🖼️',
            'book-outline' => '📚', 'rocket-outline' => '🚀', 'airplane-outline' => '✈️',
            'car-outline' => '🚗', 'home-outline' => '🏠', 'people-outline' => '👥',
            'person-outline' => '🙂', 'paw-outline' => '🐾', 'restaurant-outline' => '🍽️',
            'cafe-outline' => '☕', 'wine-outline' => '🥂', 'football-outline' => '⚽',
            'game-controller-outline' => '🎮', 'bulb-outline' => '💡', 'checkmark-circle-outline' => '✅',
            'alert-circle-outline' => '❗', 'help-circle-outline' => '❓',
        ];

        foreach (['posts' => 'content', 'comments' => 'text', 'messages' => 'text'] as $table => $column) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) continue;

            DB::table($table)->whereNotNull($column)->orderBy('id')->chunkById(100, function ($rows) use ($table, $column, $emojis) {
                foreach ($rows as $row) {
                    $value = $row->{$column};
                    foreach ($emojis as $alias => $emoji) $value = str_replace(":{$alias}:", $emoji, $value);
                    if ($value !== $row->{$column}) DB::table($table)->where('id', $row->id)->update([$column => $value]);
                }
            });
        }
    }

    public function down(): void {}
};
