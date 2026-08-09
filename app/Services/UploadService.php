<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use InvalidArgumentException;

class UploadService
{
    public function store(UploadedFile $file, string $folder): string
    {
        $folder = $this->folder($folder);
        $directory = public_path(trim(config('uploads.directory'), '/').'/'.$folder);
        File::ensureDirectoryExists($directory);

        $extension = $file->guessExtension() ?: $file->getClientOriginalExtension() ?: 'bin';
        $filename = Str::uuid().'.'.strtolower($extension);
        $file->move($directory, $filename);

        return rtrim(config('uploads.url_prefix'), '/')."/{$folder}/{$filename}";
    }

    public function delete(?string $url, ?string $expectedFolder = null): void
    {
        $path = parse_url((string) $url, PHP_URL_PATH);
        $prefix = '/'.trim(config('uploads.url_prefix'), '/').'/';
        if (! $path || ! Str::startsWith($path, $prefix)) {
            return;
        }

        $relative = Str::after($path, $prefix);
        if ($expectedFolder && ! Str::startsWith($relative, $this->folder($expectedFolder).'/')) {
            return;
        }

        File::delete(public_path(trim(config('uploads.directory'), '/').'/'.$relative));
    }

    public function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        $relativePath = '/'.ltrim($path, '/');
        if (! Str::startsWith($relativePath, ['/'.trim(config('uploads.url_prefix'), '/').'/', '/storage/'])) {
            $relativePath = '/storage/'.ltrim($relativePath, '/');
        }

        return request()->getSchemeAndHttpHost().$relativePath;
    }

    private function folder(string $folder): string
    {
        $folder = trim($folder, '/');
        if (! preg_match('/^[a-z0-9_-]+$/i', $folder)) {
            throw new InvalidArgumentException('Invalid upload folder.');
        }

        return $folder;
    }
}
