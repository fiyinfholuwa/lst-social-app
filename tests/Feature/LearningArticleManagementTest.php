<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\LearningArticle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningArticleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_publish_community_articles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $community = Community::create(['name' => 'Learning Community']);
        $payload = [
            'community_id'=>$community->id,'title'=>'Healthy Foundations','content'=>'Complete article content.',
            'position'=>1,'duration_minutes'=>5,'passing_score'=>70,'status'=>'published',
            'questions'=>[['question'=>'What matters?','answers'=>['Growth','Noise'],'correct'=>0]],
        ];
        $this->actingAs($admin)->post('/admin/articles',$payload)->assertRedirect('/admin/articles');
        $article = LearningArticle::firstOrFail();
        $this->assertDatabaseHas('learning_article_questions',['learning_article_id'=>$article->id,'question'=>'What matters?']);
        $this->patch("/admin/articles/{$article->id}",[...$payload,'title'=>'Updated Foundations'])->assertRedirect();
        $this->assertDatabaseHas('learning_articles',['id'=>$article->id,'title'=>'Updated Foundations']);
    }

    public function test_mobile_api_returns_only_published_articles_for_the_community(): void
    {
        $user = User::factory()->create();
        $community = Community::create(['name'=>'API Community']);
        $article = LearningArticle::create(['community_id'=>$community->id,'title'=>'Published Reading','content'=>'Read this.','position'=>1,'duration_minutes'=>6,'passing_score'=>80,'status'=>'published']);
        $question = $article->questions()->create(['question'=>'Ready?','position'=>1]);
        $question->answers()->createMany([['answer'=>'Yes','is_correct'=>true,'position'=>1],['answer'=>'No','is_correct'=>false,'position'=>2]]);
        LearningArticle::create(['community_id'=>$community->id,'title'=>'Draft Reading','content'=>'Hidden.','status'=>'draft']);
        $this->actingAs($user)->getJson("/api/communities/{$community->id}/articles")->assertOk()
            ->assertJsonCount(1,'articles')->assertJsonPath('articles.0.title','Published Reading')->assertJsonPath('articles.0.questions.0.correctIndex',0);
    }
}
