import { createBrowserHistory } from "history";
import { observer } from "mobx-react";
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
      path: "/loading-room",
      component: LoadingRoom,
    },
    {
      path: "/question",
      component: Question,
    },
    {
      path: "/round",
      component: Round,
    },
    {
      path: "/turn-end",
      component: TurnEnd,
    },
    {
      path: "/round-ended",
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
