import ProfileDetails from './ProfileDetails';

export const Settings: React.FC<{
      avatar: File | null;
      setAvatar: React.Dispatch<React.SetStateAction<File | null>>;
      username: string;
      setUsername: React.Dispatch<React.SetStateAction<string>>;
    }> = ({ avatar, setAvatar, username, setUsername }) => {
      return (
            <ProfileDetails avatar={avatar} setAvatar={setAvatar} username={username} setUsername={setUsername}/>
      )
};

export default Settings;