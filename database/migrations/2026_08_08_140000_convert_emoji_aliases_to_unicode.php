<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $emojis = [
            'happy-outline' => '😀', 'happy' => '😄', 'heart' => '❤️', 'heart-outline' => '💖', 'thumbs-up' => '👍', 'thumbs-down' => '👎', 'hand-left-outline' => '👋', 'star-outline' => '✨', 'star' => '⭐', 'sunny-outline' => '☀️', 'moon-outline' => '🌙', 'rainy-outline' => '🌧️', 'flower-outline' => '🌸', 'leaf-outline' => '🌿', 'flame-outline' => '🔥', 'water-outline' => '💧', 'chatbubble-outline' => '💬', 'mail-outline' => '✉️', 'gift-outline' => '🎁', 'color-palette-outline' => '🎈', 'musical-notes-outline' => '🎵', 'camera-outline' => '📷', 'images-outline' => '🖼️', 'book-outline' => '📚', 'rocket-outline' => '🚀', 'airplane-outline' => '✈️', 'car-outline' => '🚗', 'home-outline' => '🏠', 'people-outline' => '👥', 'person-outline' => '🙂', 'paw-outline' => '🐾', 'restaurant-outline' => '🍽️', 'cafe-outline' => '☕', 'wine-outline' => '🥂', 'football-outline' => '⚽', 'game-controller-outline' => '🎮', 'bulb-outline' => '💡', 'checkmark-circle-outline' => '✅', 'alert-circle-outline' => '❗', 'help-circle-outline' => '❓',
        ];
        $from = array_map(fn ($alias) => ":{$alias}:", array_keys($emojis));
        $to = array_values($emojis);

        foreach ([['posts', 'content'], ['comments', 'text'], ['messages', 'text']] as [$table, $column]) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            DB::table($table)->whereNotNull($column)->orderBy('id')->chunkById(100, function ($rows) use ($table, $column, $from, $to) {
                foreach ($rows as $row) {
                    $converted = str_replace($from, $to, $row->{$column});
                    if ($converted !== $row->{$column}) {
                        DB::table($table)->where('id', $row->id)->update([$column => $converted]);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        // Unicode emoji are the canonical portable representation.
    }
};
