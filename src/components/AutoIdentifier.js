import React, { Component } from "react";
import { DropzoneArea } from "material-ui-dropzone";
import IdResult from "./layout/IdResult";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableHead from "@material-ui/core/TableHead";

import CircularProgress from "@material-ui/core/CircularProgress";

import { Alert, AlertTitle } from "@material-ui/lab";

class AutoIdentifier extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      identification: undefined,
      predictions: [],
    };
  }

  handleDelete = () => {
    this.setState({
      files: [],
      identification: undefined,
      predictions: [],
    });
  };

  handleDrop = (files) => {
    this.setState({
      predictions: [],
      message: <CircularProgress style={{ color: "#f57c00" }} />,
    });
    const image = files[0];

    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      "Basic YXJ0c2RhdGFiYW5rZW46NHNxU3tXNjtOPi1wMkdOLQ=="
    );

    var formdata = new FormData();
    formdata.append("image", image);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    fetch(
      "http://artsdatabanken.demo.naturalis.io/v1/observation/identify/noall/auth",
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        this.props.storeAutoId(result);
      })
      .catch((error) => console.log("error", error));
  };

  render() {
    let results,
      predictionsInKey,
      numberOfPredictions,
      numberOfPredictionsInKey;

    if (this.props.predictions !== undefined) {
      results = (
        <div>
          {this.props.predictions
            .filter((prediction) => prediction.probability > 0.01)
            .map((prediction) => (
              <IdResult prediction={prediction} key={prediction.taxon.id} />
            ))}
        </div>
      );
    }

    if (this.props.predictions) {
      numberOfPredictions = this.props.predictions.length;
      predictionsInKey = this.props.predictions.filter((p) => p.isPartOfKey);
      numberOfPredictionsInKey = predictionsInKey.length;
    }

    return (
      <div>
        {!this.props.predictions ? (
          <div>
            <div style={{ overflow: "hidden" }}>
              <DropzoneArea
                onDrop={this.handleDrop.bind(this)}
                onDelete={this.handleDelete.bind(this)}
                filesLimit={1}
                maxFileSize={30000000}
                acceptedFiles={["image/*"]}
                dropzoneText={"Slep bilde hit eller trykk her"}
              />
            </div>
            <h2 style={{ margin: "2em" }}>
              <i>{this.state.message}</i>
            </h2>{" "}
          </div>
        ) : (
          <div>
            <Table aria-label="result table">
              <TableHead></TableHead>
              <TableBody>{results}</TableBody>
            </Table>

            <h3>
              {numberOfPredictionsInKey === 0
                ? "None"
                : numberOfPredictionsInKey === numberOfPredictions
                ? "All"
                : numberOfPredictionsInKey}{" "}
              of these are present in the key.
            </h3>

            <h4>Here's what you can do:</h4>

            <Alert severity="success" style={{ marginBottom: 10 }}>
              <AlertTitle>Just use the key</AlertTitle>Use the key to identify
              the species indepently from the prediction, if you are positive
              the species is covered by it.
            </Alert>

            {numberOfPredictionsInKey > 1 &&
            numberOfPredictions > numberOfPredictionsInKey ? (
              <Alert
                style={{ marginBottom: 10, cursor: "pointer" }}
                severity="warning"
                onClick={this.props.filterTaxaByPredictions.bind(
                  this,
                  predictionsInKey,
                  false
                )}
              >
                <AlertTitle>Key out the predicted species</AlertTitle>Click here
                to use the key for only the {numberOfPredictionsInKey} predicted
                species that are in the key. Only do this if you are sure that
                it has to be one of the species present in the key.
              </Alert>
            ) : (
              ""
            )}
            {numberOfPredictionsInKey > 1 &&
            numberOfPredictions === numberOfPredictionsInKey ? (
              <Alert
                style={{ marginBottom: 10, cursor: "pointer" }}
                severity="info"
                onClick={this.props.filterTaxaByPredictions.bind(
                  this,
                  predictionsInKey,
                  false
                )}
              >
                <AlertTitle>Key out the predicted species</AlertTitle>Click here
                to use the key for only the {numberOfPredictionsInKey} predicted
                species.
              </Alert>
            ) : (
              ""
            )}
            {numberOfPredictionsInKey > 0 &&
            numberOfPredictions > numberOfPredictionsInKey ? (
              <Alert
                style={{ marginBottom: 10, cursor: "pointer" }}
                severity="warning"
                onClick={this.props.filterTaxaByPredictions.bind(
                  this,
                  predictionsInKey,
                  true
                )}
              >
                <AlertTitle>Key out the higher taxon</AlertTitle>Click here to
                use the key for the higher level taxon that{" "}
                {numberOfPredictionsInKey === 1
                  ? "the"
                  : "all " + numberOfPredictionsInKey}{" "}
                predicted species that{" "}
                {numberOfPredictionsInKey === 1 ? "was" : "were"} found in the
                key {numberOfPredictionsInKey === 1 ? "belongs" : "belong"} to.
                Only do this if you are sure that it has to be one of the
                species present in the key.
              </Alert>
            ) : (
              ""
            )}
            {numberOfPredictionsInKey > 0 &&
            numberOfPredictions === numberOfPredictionsInKey ? (
              <Alert
                style={{ marginBottom: 10, cursor: "pointer" }}
                severity="info"
                onClick={this.props.filterTaxaByPredictions.bind(
                  this,
                  predictionsInKey,
                  true
                )}
              >
                <AlertTitle>Key out the higher taxon</AlertTitle>Click here to
                use the key for the higher level taxon that{" "}
                {numberOfPredictionsInKey === 1
                  ? "the"
                  : "all " + numberOfPredictionsInKey}{" "}
                predicted species{" "}
                {numberOfPredictionsInKey === 1 ? "belongs" : "belong"} to.
              </Alert>
            ) : (
              ""
            )}
          </div>
        )}
      </div>
    );
  }
}

export default AutoIdentifier;
