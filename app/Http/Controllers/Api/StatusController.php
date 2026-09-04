<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\Status;
use App\Models\StatusView;
use App\Models\User;
use App\Services\UploadService;
use Illuminate\Http\Request;

class StatusController extends Controller
{
    public function __construct(private UploadService $uploads) {}

    public function index(Request $request)
    {
        $viewer = $request->user();
        $friendIds = Friendship::query()->where('status', 'accepted')->where(fn ($q) => $q->where('sender_id', $viewer->id)->orWhere('receiver_id', $viewer->id))->get()
            ->map(fn ($friendship) => $friendship->sender_id === $viewer->id ? $friendship->receiver_id : $friendship->sender_id);
        $userIds = $friendIds->push($viewer->id);
        $statuses = Status::query()->with('user')->whereIn('user_id', $userIds)->where('expires_at', '>', now())->latest()->get()->groupBy('user_id');

        return response()->json($statuses->map(fn ($items) => [
            'user' => ['id' => (string) $items->first()->user->id, 'name' => $items->first()->user->name, 'avatar' => $this->uploads->url($items->first()->user->avatar)],
            'isMine' => $items->first()->user_id === $viewer->id,
            'hasUnseen' => $items->first()->user_id !== $viewer->id && $items->contains(fn ($status) => ! $status->views()->where('user_id', $viewer->id)->exists()),
            'statuses' => $items->map(fn ($status) => $this->data($status))->values(),
        ])->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate(['type' => 'required|in:text,image', 'text' => 'nullable|required_if:type,text|string|max:2000', 'image' => 'nullable|required_if:type,image|image|max:10240']);
        $image = $request->hasFile('image') ? $this->uploads->storeOptimizedImage($request->file('image'), 'statuses') : null;
        $status = Status::create(['user_id' => $request->user()->id, 'type' => $data['type'], 'text' => $data['type'] === 'text' ? trim($data['text']) : null, 'image' => $image, 'expires_at' => now()->addDay()]);
        return response()->json($this->data($status->load('user')), 201);
    }

    public function view(Request $request, Status $status)
    {
        abort_if($status->expires_at->isPast(), 404);
        $viewer = $request->user();
        abort_unless($status->user_id === $viewer->id || Friendship::where('status', 'accepted')->where(fn ($q) => $q->where(['sender_id' => $viewer->id, 'receiver_id' => $status->user_id])->orWhere(['sender_id' => $status->user_id, 'receiver_id' => $viewer->id]))->exists(), 403);
        if ($status->user_id !== $viewer->id) StatusView::firstOrCreate(['status_id' => $status->id, 'user_id' => $viewer->id], ['viewed_at' => now()]);
        return response()->noContent();
    }

    private function data(Status $status): array { return ['id' => (string) $status->id, 'type' => $status->type, 'text' => $status->text, 'image' => $this->uploads->url($status->image), 'createdAt' => $status->created_at->toIso8601String(), 'expiresAt' => $status->expires_at->toIso8601String()]; }
}
