@php($existingQuestions = $article?->questions ?? collect())

<section class="learning-editor-section">
    <div class="learning-step"><b>1</b><div><h2>Article</h2><p>Choose the community and write the content members must read.</p></div></div>
    <label>Community<select name="community_id" required><option value="">Choose community</option>@foreach($articleCommunities as $community)<option value="{{ $community->id }}" @selected((int)old('community_id',$article?->community_id ?? request('community'))===(int)$community->id)>{{ $community->name }} · {{ $community->learning_articles_count }} existing</option>@endforeach</select></label>
    <label>Article title<input name="title" value="{{ old('title',$article?->title) }}" required></label>
    <label>Article content<textarea name="content" class="article-content-editor" required>{{ old('content',$article?->content) }}</textarea></label>
</section>

<section class="learning-editor-section">
    <div class="learning-step"><b>2</b><div><h2>Quiz</h2><p>These questions appear immediately after the article.</p></div></div>
    <div class="form-grid"><label>Quiz time (minutes)<input type="number" min="1" max="600" name="duration_minutes" value="{{ old('duration_minutes',$article?->duration_minutes ?? 5) }}" required></label><label>Passing score %<input type="number" min="1" max="100" name="passing_score" value="{{ old('passing_score',$article?->passing_score ?? 70) }}" required></label></div>
    <div data-question-list>
        @forelse($existingQuestions as $questionIndex=>$question)
            <fieldset class="quiz-question"><legend>Question {{ $questionIndex+1 }}</legend><label>Question<input name="questions[{{ $questionIndex }}][question]" value="{{ $question->question }}" required></label><div class="form-grid">@foreach($question->answers as $answerIndex=>$answer)<label>Answer {{ $answerIndex+1 }}<input name="questions[{{ $questionIndex }}][answers][{{ $answerIndex }}]" value="{{ $answer->answer }}" required></label>@endforeach</div><label>Correct answer<select name="questions[{{ $questionIndex }}][correct]">@foreach($question->answers as $answerIndex=>$answer)<option value="{{ $answerIndex }}" @selected($answer->is_correct)>Answer {{ $answerIndex+1 }}</option>@endforeach</select></label><button class="mini-btn danger" type="button" data-remove-question>Remove question</button></fieldset>
        @empty
            <fieldset class="quiz-question"><legend>Question 1</legend><label>Question<input name="questions[0][question]" required></label><div class="form-grid">@foreach(range(0,3) as $i)<label>Answer {{ $i+1 }}<input name="questions[0][answers][{{ $i }}]" required></label>@endforeach</div><label>Correct answer<select name="questions[0][correct]">@foreach(range(0,3) as $i)<option value="{{ $i }}">Answer {{ $i+1 }}</option>@endforeach</select></label><button class="mini-btn danger" type="button" data-remove-question>Remove question</button></fieldset>
        @endforelse
    </div>
    <button class="mini-btn" type="button" data-add-question>+ Add another question</button>
</section>

<section class="learning-editor-section publishing-section">
    <div class="learning-step"><b>3</b><div><h2>Publish</h2><p>Control the order and whether members can see this activity.</p></div></div>
    <div class="form-grid"><label>Display order<input type="number" min="1" max="1000" name="position" value="{{ old('position',$article?->position ?? 1) }}" required></label><label>Status<select name="status"><option value="draft" @selected(old('status',$article?->status ?? 'draft')==='draft')>Draft</option><option value="published" @selected(old('status',$article?->status)==='published')>Published</option></select></label></div>
    <button class="btn btn-primary">{{ $article ? 'Update learning activity' : 'Create learning activity' }}</button>
</section>
