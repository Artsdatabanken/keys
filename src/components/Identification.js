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

import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import EcoIcon from "@material-ui/icons/Eco";
import VpnKeyIcon from "@material-ui/icons/VpnKey";
import BeenhereIcon from "@material-ui/icons/Beenhere";
import InfoIcon from "@material-ui/icons/Info";
import RestoreIcon from "@material-ui/icons/Restore";

import Taxon from "./Taxon";
import TaxonTreeItem from "./TaxonTreeItem";

import Character from "./Character";
import Modal from "./Modal";

import "../App.css";

// import AutoIdentifier from "./components/AutoIdentifier";

import {
  inferAlternatives,
  initElement,
  giveAnswers,
  toggleTaxonDismissed,
  isPartOfKey,
  filterTaxaByNames,
  filterTaxaByIds,
} from "../utils/logic";
import { Button } from "@material-ui/core";

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

class Identification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      characters: [],
      taxa: [],
      value: 1,
      modalObject: {},
    };
  }

  componentDidMount() {
    this.getKey(
      this.props.keys.find((k) => k.id === this.props.keyId).filename
    );
  }

  // Dismiss a taxon manually, or restore it if it was dismissed. Then see which charactes are relevant
  toggleDismissTaxon = (id) => {
    this.setState(toggleTaxonDismissed(this.state, id));
  };

  // undo a previously given answer for an alternative
  undoAnswer = (id) => {
    this.setState(giveAnswers(this.state, [[id, undefined]]));
  };

  resetAnswers = () => {
    let answers = this.state.characters.reduce(
      (arr, elem) =>
        arr.concat(
          elem.alternatives.filter((a) => a.isAnswered).map((a) => a.id)
        ),
      []
    );
    answers.forEach((a) => {
      this.giveAnswer(a, undefined);
    });
  };

  setModal = (modalObject) => {
    if (modalObject.taxon) {
      modalObject.keys = this.props.keys;
      modalObject.key = { id: this.state.id };
    } else if (modalObject.about) {
      modalObject = {
        about: {
          id: this.state.id,
          classification: this.state.classification,
          title: this.state.title,
          creators: this.state.creators,
          contributors: this.state.contributors,
          publishers: this.state.publishers,
          description: this.state.description,
          descriptionDetails: this.state.descriptionDetails,
          descriptionUrl: this.state.descriptionUrl,
          lastModified: this.state.lastModified,
          language: this.state.language,
        },
      };
      modalObject.keys = this.props.keys;
    }
    this.setState({ modalObject: modalObject });
  };

  giveAnswer = (id, value) => {
    this.setState(giveAnswers(this.state, [[id, value]]));
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

  getKey = (filename) => {
    fetch("https://keys.test.artsdatabanken.no/" + filename)
      .then((response) => response.json())
      .then((data) => {
        let myData = data;
        myData.keys = this.props.keys;

        myData = initElement(myData);

        if (this.props.taxonSelection.length) {
          myData.taxa = filterTaxaByIds(myData.taxa, this.props.taxonSelection);
        }

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

        // Give an empty answer to trigger logic
        myData = giveAnswers(myData, []);
        myData.taxaCount = myData.relevantTaxaCount;

        // myData.characters = getCharacterRelevances(myData);
        this.setState(myData);
      });
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

        



        <Modal modalObject={this.state.modalObject} setModal={this.setModal} />

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
              onClick={this.setModal.bind(this, { about: true })}
            >
              <span style={{ cursor: "pointer" }}>
                {iconItem(<InfoIcon />, "OM")}
              </span>
              {/* <InfoIcon style={{ marginLeft: "3em" }} /> */}
            </ButtonInTabs>
          </Tabs>
        </AppBar>

        {this.state.taxa.length && (
          <main style={{ width: "100%", paddingTop: 45 }}>
            <TabPanel value={value} index={0}>
              {answered.length ? (
                <div>
                  <Button
                    className="button--red"
                    style={{ marginBottom: 25 }}
                    onClick={this.resetAnswers}
                  >
                    <RestoreIcon /> Tilbakestill alle svar
                  </Button>

                  {answered.map((character) => (
                    <Character
                      character={character}
                      key={character.id}
                      giveAnswer={this.giveAnswer}
                      undoAnswer={this.undoAnswer}
                      setModal={this.setModal}
                      media={this.state.mediaElements}
                    />
                  ))}
                </div>
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
                    setModal={this.setModal}
                    media={this.state.mediaElements}
                  />
                ))}

              {this.state.relevantTaxaCount === 1 && (
                <div>
                  <Typography variant="h5" component="h5">
                    Svar funnet!
                  </Typography>
                  <Taxon
                    taxon={this.state.results[0]}
                    setModal={this.setModal}
                    toggleDismissTaxon={this.toggleDismissTaxon}
                    standalone={true}
                  />
                </div>
              )}
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
                        <TaxonTreeItem
                          toggleDismissTaxon={this.toggleDismissTaxon}
                          setModal={this.setModal}
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
                        <TaxonTreeItem
                          toggleDismissTaxon={this.toggleDismissTaxon}
                          setModal={this.setModal}
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
        )}

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
                      <TaxonTreeItem
                        toggleDismissTaxon={this.toggleDismissTaxon}
                        setModal={this.setModal}
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
                      <TaxonTreeItem
                        toggleDismissTaxon={this.toggleDismissTaxon}
                        setModal={this.setModal}
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

export default Identification;
