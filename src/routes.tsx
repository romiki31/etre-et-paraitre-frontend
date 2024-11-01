import { createBrowserHistory } from "history";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import UrlPattern from "url-pattern";
import HomePage from "./Components/HomePage";
import LoadingRoom from "./Components/LoadingRoom";
import Question from "./Components/Question";
import Round from "./Components/Round";
import RoundEnded from "./Components/RoundEnded";
import TurnEnd from "./Components/TurnEnd";

export const history = createBrowserHistory();

export function goToUrl(url: string) {
  history.push(url);
}

export function goToWithParams(path: string, pin: string, playerId: string) {
  goToUrl(`${path}/${pin}/${playerId}`);
}

export const Link: React.FC<{
  to: string;
  id?: string;
  className?: string;
  children?: any;
}> = ({ to, children, ...props }) => {
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    goToUrl(to);
  };
  return (
    <a {...props} href={to} onClick={onClick}>
      {children}
    </a>
  );
};

export const Routes = observer(() => {
  const [currentPath, setCurrentPath] = useState(history.location.pathname);

  useEffect(() => {
    const unlisten = history.listen(({ location }) => {
      setCurrentPath(location.pathname);
    });
    return () => unlisten();
  }, []);

  const items = [
    {
      path: "/",
      component: HomePage,
    },
    {
      path: "/loading-room/:pin/:playerId",
      component: LoadingRoom,
    },
    {
      path: "/question/:pin/:playerId",
      component: Question,
    },
    {
      path: "/round/:pin/:playerId",
      component: Round,
    },
    {
      path: "/turn-end/:pin/:playerId",
      component: TurnEnd,
    },
    {
      path: "/round-ended/:pin/:playerId",
      component: RoundEnded,
    },
  ];

  for (const item of items) {
    const match = new UrlPattern(item.path).match(currentPath);
    if (match) {
      return <item.component {...match} />;
    }
  }

  return <div>Not found</div>;
});
