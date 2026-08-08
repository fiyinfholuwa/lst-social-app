<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $destination = public_path('custom_folder/posts');
        File::ensureDirectoryExists($destination);

        DB::table('posts')->orderBy('id')->chunkById(100, function ($posts) use ($destination) {
            foreach ($posts as $post) {
                $images = $post->images ? json_decode($post->images, true) : ($post->image ? [$post->image] : []);
                $updated = collect($images)->map(function ($image) use ($destination) {
                    $path = parse_url($image, PHP_URL_PATH);
                    if (! $path || ! Str::contains($path, '/storage/posts/')) {
                        return $image;
                    }

                    $filename = basename($path);
                    $source = storage_path("app/public/posts/{$filename}");
                    if (File::exists($source) && ! File::exists("{$destination}/{$filename}")) {
                        File::copy($source, "{$destination}/{$filename}");
                    }

                    return "/custom_folder/posts/{$filename}";
                })->values()->all();

                DB::table('posts')->where('id', $post->id)->update([
                    'image' => $updated[0] ?? null,
                    'images' => $updated ? json_encode($updated) : null,
                ]);
            }
        });
    }

    public function down(): void
    {
        // Custom-folder paths remain valid and are intentionally not made host-specific again.
    }
};
