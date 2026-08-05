<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'bio' => $this->bio,
            'role' => $this->role,
            'joinedCommunities' => $this->whenLoaded('communities', fn () => $this->communities->pluck('id')->map(fn ($id) => (string) $id)->values()),
        ];
    }
}
