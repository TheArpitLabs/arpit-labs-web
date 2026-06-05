import CreatePostForm from '@/components/community/CreatePostForm';

export default function NewCommunityPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
      <div className="max-w-2xl">
        <CreatePostForm />
      </div>
    </div>
  );
}
