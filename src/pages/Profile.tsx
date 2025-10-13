import { UserProfile } from '../components/profile/UserProfile';

export function Profile() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <UserProfile />
      </div>
    </div>
  );
}