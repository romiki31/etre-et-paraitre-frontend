import { createBrowserHistory } from "history";
import { createObservableHistory } from "mobx-observable-history";
import { observer } from "mobx-react";
import { Component } from "react";
import UrlPattern from "url-pattern";
import HomePage from "./Components/HomePage";
import LoadingRoom from "./Components/LoadingRoom";
import Question from "./Components/Question";
import Round from "./Components/Round";
import RoundEnded from "./Components/RoundEnded";
import TurnEnd from "./Components/TurnEnd";

export const history = createObservableHistory(createBrowserHistory());
export function goToUrl(url: string) {
  if (!history) return;
  history.push(url);
}

export class Link extends Component<{
  to: string;
  id?: string;
  className?: string;
  children?: any;
}> {
  onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    goToUrl(this.props.to);
  };
  render() {
    let { to, ...props } = this.props;

    return <a {...props} href={to} onClick={this.onClick} />;
  }
}

export const Routes = observer(() => {
  let pathname = history.location.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    history.replace(pathname.substring(0, pathname.length - 1));
    return null;
  }

  let items = [
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
    const match = new UrlPattern(item.path).match(pathname);
    if (match) {
      return <item.component {...match} />;
    }
  }

  return <div>Not found</div>;
});
