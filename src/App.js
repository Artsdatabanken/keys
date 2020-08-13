import React, { Component } from "react";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Hidden from "@material-ui/core/Hidden";
import Drawer from "@material-ui/core/Drawer";
import TreeView from "@material-ui/lab/TreeView";
import TreeItem from "@material-ui/lab/TreeItem";
import Modal from "@material-ui/core/Modal";

import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import EcoIcon from "@material-ui/icons/Eco";
import VpnKeyIcon from "@material-ui/icons/VpnKey";
import BeenhereIcon from "@material-ui/icons/Beenhere";
import InfoIcon from "@material-ui/icons/Info";

import Taxon from "./components/Taxon";
import Character from "./components/Character";
// import AutoIdentifier from "./components/AutoIdentifier";

import {
  inferAlternatives,
  initElement,
  giveAnswers,
  toggleTaxonDismissed,
  isPartOfKey,
  filterTaxaByNames,
  getRelevantTaxaCount,
  setModal,
} from "./utils/Identification";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

function HidingTab(props) {
  return (
    <Hidden mdUp>
      <Tab {...props} />
    </Hidden>
  );
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      characters: [],
      taxa: [],
      modalOpen: false,
      modalContent: <div />,
      value: 1,
    };
  }

  componentDidMount() {
    fetch("https://artsdatabanken.no/Files/35142")
      .then((response) => response.json())
      .then((data) => {
        let myData = data;

        myData = initElement(myData);

        // Set statements with undefined frequencies to frequency=1 (i.e. always true)
        myData.statements = myData.statements.map((statement) => {
          if (statement.frequency === undefined) {
            statement.frequency = 1;
          }
          return statement;
        });

        // Add conflicts for taxa that have no answer for the alternative, but do for the character
        let addStatements = [];
        myData.characters.forEach((character) => {
          const taxaWithCharacter = myData.statements
            .filter((sm) => sm.characterId === character.id)
            .map((sm) => sm.taxonId);
          character.alternatives.forEach((alternative) => {
            const taxaWithAlternative = myData.statements
              .filter((sm) => sm.value === alternative.id)
              .map((sm) => sm.taxonId);
            const addTaxa = [
              ...new Set(
                taxaWithCharacter.filter(
                  (tx) => !taxaWithAlternative.includes(tx)
                )
              ),
            ];
            for (let taxon of addTaxa) {
              addStatements.push({
                id: `statement:${alternative.id}_${taxon}_0`,
                taxonId: taxon,
                characterId: character.id,
                value: alternative.id,
                frequency: 0,
              });
            }
          });
        });

        myData.statements = myData.statements.concat(addStatements);

        myData = inferAlternatives(myData);

        myData.relevantTaxaCount = getRelevantTaxaCount(myData.taxa);

        myData.taxaCount = myData.relevantTaxaCount;
        myData.results = [];

        // myData.characters = getCharacterRelevances(myData);
        this.setState(myData);
      });
  }

  // Dismiss a taxon manually, or restore it if it was dismissed. Then see which charactes are relevant
  toggleDismissTaxon = (id) => {
    this.setState(toggleTaxonDismissed(this.state, id));
  };

  // undo a previously given answer for an alternative
  undoAnswer = (id) => {
    this.setState(giveAnswers(this.state, [[id, undefined]]));
  };

  giveAnswer = (id, value) => {
    this.setState(giveAnswers(this.state, [[id, value]], this.openModal));
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  storeAutoId = (idResult) => {
    this.setState({
      predictions: idResult.predictions
        .filter((prediction) => prediction.probability > 0.01)
        .map((prediction) => {
          prediction.isPartOfKey = isPartOfKey(
            this.state.taxa,
            prediction.taxon.name
          );
          return prediction;
        }),
    });
  };

  filterTaxaByPredictions = (predictions, keepCommonTaxon) => {
    this.setState(
      filterTaxaByNames(
        this.state,
        predictions.map((p) => p.taxon.name),
        keepCommonTaxon
      )
    );
  };

  getTaxonAllIds = (taxa = this.state.taxa) => {
    return taxa
      .map((t) => t.id + "_relevant")
      .concat(taxa.map((t) => t.id + "_irrelevant"));
  };

  openModal = (content, type = "jsx") => {
    this.setState(setModal(this.state, content, type, this.openModal));
  };

  closeModal = () => {
    this.setState({ modalOpen: false });
  };

  render() {
    const { value } = this.state;

    const answered = this.state.characters.filter(
      (character) => character.isAnswered
    );

    const questions = this.state.characters.filter(
      (character) => !character.isAnswered && character.relevant !== false
    );

    const iconItem = (icon, text, number) => {
      if (number >= 0) {
        return (
          <span style={{ justifyContent: "center", display: "flex" }}>
            <span style={{ paddingRight: "6px" }}>{icon}</span>{" "}
            <Hidden xsDown> {text} </Hidden>({number})
          </span>
        );
      }
      return (
        <span style={{ justifyContent: "center", display: "flex" }}>
          <span style={{ paddingRight: "6px" }}>{icon}</span>{" "}
          <Hidden xsDown> {text} </Hidden>
        </span>
      );
    };

    const ButtonInTabs = ({ className, onClick, children }) => {
      return (
        <Typography
          variant="overline"
          className={className}
          onClick={onClick}
          children={children}
          style={{
            paddingTop: "8px",
            opacity: "0.7",
            fontSize: "0.875rem",
            fontWeight: "500",
            lineHeight: "1.75",
          }}
        ></Typography>
      );
    };

    return (
      <div style={{ display: "flex" }}>
        <Modal
          open={this.state.modalOpen}
          onClose={this.closeModal}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        >
          {this.state.modalContent}
        </Modal>

        <AppBar
          position="fixed"
          style={{ backgroundColor: "#f57c00", zIndex: 1 }}
        >
          <Tabs value={value} onChange={this.handleChange}>
            <Tab
              label={iconItem(<BeenhereIcon />, "Mine svar", answered.length)}
            />
            <Tab
              label={iconItem(
                <VpnKeyIcon />,
                "Ubesvart",
                this.state.relevantTaxaCount > 1 ? questions.length : 0
              )}
            />

            {/* <Tab label={iconItem(<AddAPhotoIcon />, "Auto id")} /> */}

            <HidingTab
              value={3}
              label={iconItem(
                <EcoIcon />,
                "Taksa",
                this.state.relevantTaxaCount
              )}
            />

            <ButtonInTabs
              value={4}
              onClick={this.openModal.bind(this, undefined, "about")}
            >
              {iconItem(<InfoIcon />, "OM")}

              {/* <InfoIcon style={{ marginLeft: "3em" }} /> */}
            </ButtonInTabs>
          </Tabs>
        </AppBar>

        <main style={{ width: "100%", paddingTop: 45 }}>
          <TabPanel value={value} index={0}>
            {answered.length ? (
              answered.map((character) => (
                <Character
                  character={character}
                  key={character.id}
                  giveAnswer={this.giveAnswer}
                  undoAnswer={this.undoAnswer}
                  openModal={this.openModal}
                  media={this.state.mediaElements}
                />
              ))
            ) : (
              <span>
                <Typography variant="h5" component="h5">
                  Ingen svar ennå
                </Typography>
                <Typography variant="subtitle1">
                  Svar på spørsmålene i nøkkelen for å identifisere arten.
                </Typography>
              </span>
            )}
          </TabPanel>
          <TabPanel value={value} index={1}>
            {this.state.relevantTaxaCount > 1 &&
              questions.map((character) => (
                <Character
                  character={character}
                  key={character.id}
                  giveAnswer={this.giveAnswer}
                  undoAnswer={this.undoAnswer}
                  openModal={this.openModal}
                  media={this.state.mediaElements}
                />
              ))}
          </TabPanel>
          {/* <TabPanel value={value} index={2}>
            <AutoIdentifier
              storeAutoId={this.storeAutoId}
              filterTaxaByPredictions={this.filterTaxaByPredictions}
              predictions={this.state.predictions}
            />
          </TabPanel> */}
          <Hidden mdUp>
            <TabPanel value={value} index={3}>
              <TreeView
                defaultExpanded={["relevant"].concat(this.getTaxonAllIds())}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                disableSelection={true}
              >
                <TreeItem
                  nodeId="relevant"
                  label={
                    <Typography variant="h5" component="h5">
                      Mulige utfall ({this.state.relevantTaxaCount})
                    </Typography>
                  }
                >
                  {this.state.taxa
                    .filter((taxon) => taxon.isRelevant)
                    .map((taxon) => (
                      <Taxon
                        toggleDismissTaxon={this.toggleDismissTaxon}
                        openModal={this.openModal}
                        taxon={taxon}
                        media={this.state.mediaElements}
                        key={taxon.id}
                        filter="relevant"
                      />
                    ))}
                </TreeItem>
                <TreeItem
                  nodeId="irrelevant"
                  label={
                    <Typography variant="h5" component="h5">
                      Utelukket (
                      {this.state.taxaCount - this.state.relevantTaxaCount})
                    </Typography>
                  }
                >
                  {this.state.taxa
                    .filter((taxon) => taxon.isIrrelevant)
                    .map((taxon) => (
                      <Taxon
                        toggleDismissTaxon={this.toggleDismissTaxon}
                        openModal={this.openModal}
                        media={this.state.mediaElements}
                        taxon={taxon}
                        key={taxon.id}
                        filter="irrelevant"
                      />
                    ))}
                </TreeItem>
              </TreeView>
            </TabPanel>
          </Hidden>
        </main>

        <Hidden smDown>
          <Drawer
            variant="permanent"
            anchor="right"
            style={{ paddingTop: 50, width: 400, zIndex: 0 }}
          >
            <Box
              style={{
                width: 350,
                padding: 20,
                marginTop: 50,
                overflow: "auto",
              }}
            >
              <TreeView
                defaultExpanded={["relevant"].concat(this.getTaxonAllIds())}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                disableSelection={true}
              >
                <TreeItem
                  nodeId="relevant"
                  label={
                    <Typography variant="h5" component="h5">
                      Mulige utfall ({this.state.relevantTaxaCount})
                    </Typography>
                  }
                >
                  {this.state.taxa
                    .filter((taxon) => taxon.isRelevant)
                    .map((taxon) => (
                      <Taxon
                        toggleDismissTaxon={this.toggleDismissTaxon}
                        openModal={this.openModal}
                        taxon={taxon}
                        media={this.state.mediaElements}
                        key={taxon.id}
                        filter="relevant"
                      />
                    ))}
                </TreeItem>
                <TreeItem
                  nodeId="irrelevant"
                  label={
                    <Typography variant="h5" component="h5">
                      Utelukket (
                      {this.state.taxaCount - this.state.relevantTaxaCount})
                    </Typography>
                  }
                >
                  {this.state.taxa
                    .filter((taxon) => taxon.isIrrelevant)
                    .map((taxon) => (
                      <Taxon
                        toggleDismissTaxon={this.toggleDismissTaxon}
                        openModal={this.openModal}
                        taxon={taxon}
                        media={this.state.mediaElements}
                        key={taxon.id}
                        filter="irrelevant"
                      />
                    ))}
                </TreeItem>
              </TreeView>
            </Box>
          </Drawer>
        </Hidden>
      </div>
    );
  }
}

export default App;
