import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import "./components/menu/menu";
import Menu from "./components/menu/menu";
import PatternList from "./components/menu/patternList";
import Patterns from "./components/patterns";
import FavouritesList from "./components/menu/FavouritesList";
import "bootstrap/dist/css/bootstrap.min.css";
import Edit from "./components/edit/Edit";
import View from "./components/view/View";
import HistoryCard from "./components/edit/HistoryCard";

export default function App() {
  let content;
  let showPage;
  let [showMenu, setShowMenu] = useState(false);
  let [patternCards, setPatternCards] = useState([]);
  //sets state to conditionally render home/edit pages
  let [page, setPage] = useState("home");
  //sets current user in state
  const [user, setUser] = useState([]);
  const [storage, setStorage] = useState([]);
  //sets current pattern in state
  const [pattern, setPattern] = useState(null);
  //sets current checkpoint in state
  const [checkpoint, setCheckpoint] = useState({});
  //sets current version history in state
  const [history, setHistory] = useState([]);

  function getCheckpointHistory() {
    axios
      .get("api/checkpoints")
      .then(res => {
        const checkpointHistory = res.data.filter(item => {
          return item.pattern_id === checkpoint.pattern_id;
        });
        setHistory([...checkpointHistory]);
      })
      .catch(err => {
        console.log("CPhitsory get failed because", err);
      });
  }
  //puts initial pattern and checkpoint in the database
  function createPattern(patternData) {
    let currentUser = user.id;
    if (!currentUser) {
      return alert("You must log in");
    }
    let reqData = {
      user_id: currentUser,
      description: patternData.description,
      title: patternData.title,
      colours: patternData.colours
    };
    console.log("reqData here", reqData);

    axios
      .post("api/patterns", reqData)
      .then(res => {
        setPattern(res.data.pattern);
        setCheckpoint(res.data.checkpoint);
        setPatternCards([...patternCards, res.data.pattern]);
      })
      .catch(error => {
        console.log("error here", error);
        return alert("Could not save pattern", error);
      });
  }

  function createCheckpoint(saveData) {
    let currentPattern = pattern.id;
    if (!currentPattern) {
      return alert("You must choose an existing pattern to edit");
    }
    if (user.id !== pattern.user_id) {
      return alert("You must fork a pattern before editing!");
    }
    let reqData = {
      pattern_id: pattern.id,
      colours: saveData.colours
    };
    axios
      .post("api/checkpoints", reqData)
      .then(res => {
        setCheckpoint(res.data);
      })
      .catch(error => {
        return alert("Could not update because: ", error);
      });
  }

  function saveHandler(data) {
    if (pattern && checkpoint) {
      createCheckpoint(data);
      getCheckpointHistory();
    } else {
      // console.log("data in the else", data);
      createPattern(data);
      // getCheckpointHistory()
    }
  }

  let [clickedView, setClickedView] = useState({})
  //this function is fired from patternlist item , sets the state for clickedView which is 
  //passed to the View component
  function renderSavedPattern(patternId) {
    axios.get("api/checkpoints")
      .then((res) => {
        let currentView = res.data.filter((item) => {
          return item.pattern_id === patternId
        })
        let currentViewOnPage = currentView[currentView.length - 1]
        setClickedView(currentViewOnPage)
        setCheckpoint(currentViewOnPage)
        // setPattern(currentViewOnPage.pattern_id)

      }).catch((err) => {
        console.log("current view for checkpoint failed because", err)
      })
  }

  //gets pattern object for checkpoint so it can be passed to the backend when editing existing patterns
  function getPattern() {
    return patternCards.map((item) => {
      if (item.id === checkpoint.pattern_id) {
        setPattern(item)
      }
    })
  }
  //renders either homepage, view page or grid based on click
  if (page === "home") {
    showPage = <Patterns
      patterns={patternCards} />
  } else if (page === "create") {
    showPage = <Edit
      saveHandler={saveHandler}
      checkpointHistory={history}
      setClickedView={clickedView}

      setPage={page}
    />
  } else if (page === "view") {
    showPage = <View
      currentPattern={pattern}
      checkpointHistory={history}
      currentCheckpoint={checkpoint}
      setClickedView={clickedView}
      setPage={setPage}
      getCheckpointHistory={getCheckpointHistory}
      getPattern={getPattern}
    />

  }
  else if (page === "edit") {
    showPage = <Edit
      saveHandler={saveHandler}
      checkpointHistory={history}
      setClickedView={clickedView}
      setPage={page}
    />
  }
  else {
    showPage = <div></div>
  }

  //opens side menu
  if (showMenu === false) {
    content = <div></div>;
  } else {
    content = <PatternList
      setPage={setPage}
      renderSavedPattern={renderSavedPattern}

    />;
  }



  //closes side menu when you click away
  function clickOffMenu() {
    if (showMenu === true) {
      setShowMenu(false);
    }
  }

  console.log("this is current pattern in state", pattern)
  console.log("this is current checkpoint in state", checkpoint)
  //clears pattern and resets state when create button is clicked
  //TODO does not yet reset grid bc grid state lives in sub component
  function clearAndSetCreate() {
    setPattern(null);
    setCheckpoint({});
    setPage("create");
  }

  useEffect(() => {
    axios.get("/api/patterns").then(response => setPatternCards(response.data));
  }, []);

  return (
    <div className="App" onClick={clickOffMenu}>
      <Menu
        setShowMenu={setShowMenu}
        setPage={setPage}
        clearAndSetCreate={clearAndSetCreate}
        setUser={setUser}
        setStorage={setStorage}
      />
      <div className="main">
        {content}
        {showPage}
      </div>
    </div>
  );
}
