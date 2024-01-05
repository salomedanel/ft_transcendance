import React, { useEffect, useState } from 'react';
import friends1Icon from '../../../assets/friends1.png';
import friends5Icon from '../../../assets/friends5.png';
import game1Icon from '../../../assets/game1.png';
import game15Icon from '../../../assets/game15.png';
import win1Icon from '../../../assets/win1.png';
import win3Icon from '../../../assets/win3.png';
import win15Icon from '../../../assets/win15.png';
import play10Icon from '../../../assets/play10.png';
import '../style/AchievementList.css';

interface Achievement {
  title: string;
  description: string;
  iconUrl: string;
  achieved: boolean;
}

interface Friend {
  username: string;
  status: string;
  avatar: string;
}

interface GameHistory {
  date: string;
  player: string;
  player1: string;
  player2: string;
  score: [number, number];
  winner: string;
}

interface AchievementListProps {
  friends: Friend[];
  gameHistory: GameHistory[];
  username: string | undefined;
}

const AchievementList: React.FC<AchievementListProps> = ({ friends, gameHistory, username }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const calculateAchievements = () => {
      const newAchievements: Achievement[] = [];

      if (friends.length >= 1) {
        newAchievements.push({
          title: "Hi, I'm new. Hi new, I'm hi.",
          description: 'Have at least one friend',
          iconUrl: friends1Icon,
          achieved: true,
        });
      }

      if (friends.length >= 5) {
        newAchievements.push({
          title: 'Stronger, together',
          description: 'Have at least five friends',
          iconUrl: friends5Icon,
          achieved: true,
        });
      }

      if (gameHistory.length >= 1) {
        newAchievements.push({
          title: 'Oooh, so this is pong',
          description: 'Play at least one game',
          iconUrl: game1Icon,
          achieved: true,
        });
      }

      if (gameHistory.length >= 15) {
        newAchievements.push({
          title: "Ah shit, here we go again",
          description: 'Play at least fifteen games',
          iconUrl: game15Icon,
          achieved: true,
        });
      }

      const hasWonAtLeastOneGame = gameHistory.some(
        (game) =>
          (game.winner === username));

      if (hasWonAtLeastOneGame) {
        newAchievements.push({
          title: "I did it mom!",
          description: 'Win at least one game',
          iconUrl: win1Icon,
          achieved: true,
        });
      }

      const hasWonThreeGamesInARow = gameHistory.some((game, index) => {
		// Check if the current game and the next two games have the same winner as the specified username
		return (
		  gameHistory[index]?.winner === username &&
		  gameHistory[index + 1]?.winner === username &&
		  gameHistory[index + 2]?.winner === username
		);
	  });

      if (hasWonThreeGamesInARow) {
        newAchievements.push({
          title: "Are ya winning, son?",
          description: 'Win three games in a row',
          iconUrl: win3Icon,
          achieved: true,
        });
      }

      const wonAtLeastFifteenGames = gameHistory.filter(
        (game) =>
          (game.winner === username)
      ).length >= 14;

      if (wonAtLeastFifteenGames) {
        newAchievements.push({
          title: "Call me the Pong God",
          description: 'Win at least fifteen games',
          iconUrl: win15Icon,
          achieved: true,
        });
      }

      const gameDaysMap = new Map<string, number>();

    gameHistory.forEach((game) => {
    const dateString = new Date(game.date).toLocaleDateString();
    gameDaysMap.set(dateString, (gameDaysMap.get(dateString) || 0) + 1);
    });

    if (Array.from(gameDaysMap.values()).some((count) => count >= 10)) {
    newAchievements.push({
        title: "Y'all got any more of them Pong?",
        description: 'Play at least 10 games in the same day',
        iconUrl: play10Icon,
        achieved: true,
    });
    }

      setAchievements(newAchievements);
    };

    calculateAchievements();
  }, [friends, gameHistory, username]);

  return (
    <div className="achievement-list">
      <h2 className="achievement-title">Achievements</h2>
      <ul>
        {achievements.map((achievement, index) => (
          <li key={index} className="achievement-item">
            <img src={achievement.iconUrl} alt={`${achievement.title} by icon8`} />
            <div>
              <h3 className="achievement-title">{achievement.title}</h3>
              <p className="achievement-description">{achievement.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <span className='about'>Icons by <a target="_blank" href="https://icons8.com">Icons8</a></span>
    </div>
  );
};

export default AchievementList;
