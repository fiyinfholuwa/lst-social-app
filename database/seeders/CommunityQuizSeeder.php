<?php

namespace Database\Seeders;

use App\Models\Community;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

class CommunityQuizSeeder extends Seeder
{
    /**
     * Seed only the reading gate that exists in the mobile application.
     * The mobile data file remains the canonical source for article and quiz copy.
     */
    public function run(): void
    {
        $community = Community::where('name', 'Quick Marital Settlement')->firstOrFail();
        $leader = User::where('email', 'pastor.peniela@lstsocial.app')->firstOrFail();
        $articles = $this->readCanonicalArticles();

        DB::transaction(function () use ($community, $leader, $articles): void {
            $incorrectTitles = [
                'Purity Commitment & Community Guidelines',
                'Recovery Safety & Accountability',
                'Marriage Healing Foundations',
                'Healthy Marriage Preparation',
                'Courtship & Communication Essentials',
                'Discipleship Commitment',
                'Wholeness Mentorship Orientation',
            ];
            $seededTitles = array_merge($incorrectTitles, array_column($articles, 'title'));
            $oldPostIds = DB::table('quizzes')->whereIn('title', $seededTitles)->pluck('post_id')->filter();

            DB::table('quizzes')->whereIn('title', $seededTitles)->delete();
            Post::whereIn('id', $oldPostIds)->where('type', 'Required reading')->delete();

            foreach ($articles as $articleIndex => $article) {
                $post = Post::create([
                    'user_id' => $leader->id,
                    'community_id' => $community->id,
                    'content' => $article['content'],
                    'type' => 'Required reading',
                    'audience' => $community->name,
                ]);

                $quizId = DB::table('quizzes')->insertGetId([
                    'community_id' => $community->id,
                    'post_id' => $post->id,
                    'title' => $article['title'],
                    'instructions' => 'Read the complete article, answer all 10 questions in five minutes, and score at least 7/10.',
                    'duration_minutes' => 5,
                    'passing_score' => 70,
                    'max_attempts' => null,
                    'randomize_questions' => false,
                    'show_answers' => false,
                    'status' => 'published',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach ($article['questions'] as $questionIndex => $question) {
                    $questionId = DB::table('quiz_questions')->insertGetId([
                        'quiz_id' => $quizId,
                        'question' => $question['question'],
                        'position' => $questionIndex + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    foreach ($question['options'] as $answerIndex => $answer) {
                        DB::table('quiz_answers')->insert([
                            'quiz_question_id' => $questionId,
                            'answer' => $answer,
                            'is_correct' => $answerIndex === $question['correctIndex'],
                            'position' => $answerIndex + 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        });

        Cache::flush();
    }

    private function readCanonicalArticles(): array
    {
        $source = file_get_contents(base_path('lst_mobile/src/data/quickMaritalReading.js'));
        preg_match_all(
            "/\\{\\s*id: '([^']+)',\\s*title: '([^']+)',\\s*content: `([\\s\\S]*?)`,\\s*questions: \\[([\\s\\S]*?)\\],\\s*\\},/",
            $source,
            $articleMatches,
            PREG_SET_ORDER
        );

        $articles = [];
        foreach ($articleMatches as $articleMatch) {
            preg_match_all(
                "/\\{ question: '((?:\\\\'|[^'])*)', options: \\[([^]]+)\\], correctIndex: (\\d+) \\}/",
                $articleMatch[4],
                $questionMatches,
                PREG_SET_ORDER
            );
            $questions = [];
            foreach ($questionMatches as $questionMatch) {
                preg_match_all("/'((?:\\\\'|[^'])*)'/", $questionMatch[2], $optionMatches);
                $questions[] = [
                    'question' => str_replace("\\'", "'", $questionMatch[1]),
                    'options' => array_map(fn ($option) => str_replace("\\'", "'", $option), $optionMatches[1]),
                    'correctIndex' => (int) $questionMatch[3],
                ];
            }
            $articles[] = ['id' => $articleMatch[1], 'title' => $articleMatch[2], 'content' => trim($articleMatch[3]), 'questions' => $questions];
        }

        if (count($articles) !== 3 || collect($articles)->contains(fn ($article) => count($article['questions']) !== 10)) {
            throw new RuntimeException('The canonical Quick Marital reading data could not be parsed safely.');
        }

        return $articles;
    }
}
