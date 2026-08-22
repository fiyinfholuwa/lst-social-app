<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isOwner = (int) $request->user()?->id === (int) $this->id;
        $canSeeDetails = $isOwner || ! $this->is_profile_private;

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'firstName' => $this->when($isOwner, $this->first_name),
            'lastName' => $this->when($isOwner, $this->last_name),
            'email' => $this->when($isOwner, $this->email),
            'emailVerified' => $this->when($isOwner, $this->hasVerifiedEmail()),
            'verified' => $this->email_verified_at !== null,
            'phoneNumber' => $this->when($canSeeDetails, $this->phone_number),
            'avatar' => $this->mediaUrl($request, $this->avatar),
            'bio' => $this->when($canSeeDetails, $this->bio),
            'hobbies' => $this->when($canSeeDetails, $this->hobbies),
            'maritalStatus' => $this->when($canSeeDetails, $this->marital_status),
            'dateOfBirth' => $this->when($canSeeDetails, $this->date_of_birth?->format('Y-m-d')),
            'workplace' => $this->when($canSeeDetails, $this->workplace),
            'occupation' => $this->when($canSeeDetails, $this->occupation),
            'isProfilePrivate' => (bool) $this->is_profile_private,
            'canSeePrivateDetails' => $canSeeDetails,
            'role' => $this->role,
            'joinedCommunities' => $this->when($canSeeDetails && $this->relationLoaded('communities'), fn () => $this->communities->pluck('id')->map(fn ($id) => (string) $id)->values()),
        ];
    }

    private function mediaUrl(Request $request, ?string $url): ?string
    {
        if (! $url) return null;
        $path = parse_url($url, PHP_URL_PATH);

        return $path && (Str::startsWith($path, '/storage/') || Str::startsWith($path, '/custom_folder/'))
            ? $request->getSchemeAndHttpHost().$path
            : $url;
    }
}
