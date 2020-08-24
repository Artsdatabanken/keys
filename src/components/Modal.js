import React from "react";

import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Dialog from "@material-ui/core/Dialog";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

import Button from "@material-ui/core/Button";
import ReactMarkdown from "react-markdown";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import ItemMetadata from "../components/ItemMetadata";
import KeyInfo from "./KeyInfo";

function Modal(props) {
  let { modalObject, setModal } = props;

  let modalContent;

  if (modalObject.results) {
    if (modalObject.results.length === 1) {
      let taxon = modalObject.results[0];

      taxon.children = taxon.children
        ? taxon.children.filter((child) => child.isRelevant)
        : [];
    } else {
      modalContent = (
        <div style={{ margin: "25px" }}>
          <Typography variant="h4" style={{ fontSize: "2em" }} component="h1">
            Resultatet kan ikke bestemmes videre
          </Typography>

          <Typography
            variant="body2"
            style={{ fontSize: "1.25em" }}
            component="p"
          >
            Følgende resultater gjenstår:
          </Typography>

          {modalObject.results.map((c) => {
            let form;
            if (c.children && c.children.length === 1) {
              form = c.children[0];
            }

            return (
              <div>
                <hr style={{ marginTop: "3em" }} />
                <Typography
                  variant="h2"
                  style={{ fontSize: "1.82em" }}
                  component="h2"
                >
                  {c.vernacularName}
                </Typography>
                <Typography
                  variant="body2"
                  component="h3"
                  style={{ marginBottom: "1em", fontSize: "1.2em" }}
                >
                  <i>{c.scientificName}</i>
                  {form && (
                    <Chip
                      style={{
                        marginLeft: 5,
                      }}
                      size="small"
                      variant="default"
                      label={form.vernacularName}
                    />
                  )}
                </Typography>

                {c.descriptionUrl && (
                  <div>
                    <Button
                      className="button--orange"
                      onClick={setModal.bind(this, { url: c.descriptionUrl })}
                    >
                      Les mer
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
  } else if (modalObject.url) {
    modalContent = (
      <object
        aria-label="External page"
        type="text/html"
        data={modalObject.url}
        width="100%"
        height="600"
      ></object>
    );
  } else if (modalObject.about) {
    let key = modalObject.about;

    let parentKeys = modalObject.keys.filter(
      (k) =>
        k.resultTaxa.find(
          (rt) =>
            rt ===
            key.classification[key.classification.length - 1].ScientificNameId
        ) ||
        k.subTaxa.find(
          (st) =>
            st.ScientificNameId ===
            key.classification[key.classification.length - 1].ScientificNameId
        )
    );

    modalContent = (
      <div style={{ margin: "25px" }}>
        <Typography variant="h3" component="h1">
          {key.title}
        </Typography>
        <Typography variant="overline" component="span">
          Bestemmelsesnøkkel
        </Typography>
        <Typography variant="body1" component="p">
          <b>{key.description}</b>
        </Typography>
        <Typography variant="body2" component="div">
          <ReactMarkdown source={key.descriptionDetails} />
        </Typography>
        {key.descriptionUrl && (
          <div>
            <Button
              className="button--orange"
              onClick={setModal.bind(this, { url: key.descriptionUrl })}
            >
              Les mer om nøkkelen
            </Button>
          </div>
        )}
        <hr style={{ marginTop: "3em" }} />
        <ItemMetadata item={key} setModal={setModal} />
        <div>Versjon: {key.lastModified}</div>
        <div>Id: {key.id}</div>
        <div>Språk: {key.language}</div>
        {!!parentKeys.length && (
          <div>
            <hr style={{ marginTop: "3em" }} />
            <Typography variant="overline" component="p">
              Ikke sikker om dette er nøkkelen du trenger? Følgende{" "}
              {parentKeys.length === 1 ? "nøkkel" : "nøkler"} kan brukes til å
              sjekke om{" "}
              {key.classification[key.classification.length - 1].ScientificName}{" "}
              er riktig takson:
            </Typography>

            {parentKeys.map((p) => (
              <KeyInfo key={p.id} keyItem={p} />
            ))}
          </div>
        )}
        <hr style={{ marginTop: "3em" }} />
        <Typography variant="overline" component="p">
          Artsdatabanken har også {modalObject.keys.length - 1} andre nøkler.{" "}
          <a href="./">Gå til oversikten</a>.
        </Typography>
      </div>
    );
  } else if (modalObject.taxon) {
    let { taxon, keys, key } = modalObject;

    if (!taxon.media && taxon.isResult && taxon.children.length) {
      let child = taxon.children.find((c) => c.media) || {
        media: undefined,
      };
      taxon.media = child.media;
    }

    let form;
    if (taxon.children && taxon.children.length === 1) {
      form = taxon.children[0];
    }

    let followUpKeys = taxon.externalReference
      ? keys.filter(
          (k) =>
            k.id !== key.id &&
            (k.classification[k.classification.length - 1].ScientificNameId ===
              taxon.externalReference.externalId ||
              k.subTaxa.find(
                (st) =>
                  st.ScientificNameId === taxon.externalReference.externalId
              ))
        )
      : [];

    modalContent = (
      <div style={{ margin: "25px" }}>
        {taxon.media && (
          <div>
            <img
              src={
                (
                  taxon.media.mediaElement.find((m) => m.height >= 1280) ||
                  taxon.media.mediaElement[taxon.media.mediaElement.length - 1]
                ).url
              }
              style={{
                maxHeight: "50vh",
                maxWidth: "90vw",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
              }}
              alt={`Bilde: ${taxon.scientificName}`}
            />
          </div>
        )}
        <Typography variant="h2" style={{ fontSize: "2.5em" }} component="h2">
          {taxon.vernacularName}
        </Typography>

        <Typography
          variant="body2"
          component="h2"
          style={{ marginBottom: "1em", fontSize: "1.3em" }}
        >
          <i>{taxon.scientificName}</i>
          {form && form.vernacularName && (
            <Chip
              style={{ marginLeft: 5 }}
              size="small"
              variant="default"
              label={form.vernacularName}
            />
          )}
        </Typography>

        <Typography variant="body1" component="p" style={{ fontSize: "1.4em" }}>
          <b>{taxon.description}</b>
        </Typography>

        <Typography
          variant="body2"
          component="div"
          style={{ marginBottom: "3em", fontSize: "1.2em" }}
        >
          <ReactMarkdown source={taxon.descriptionDetails} />
        </Typography>
        {taxon.descriptionUrl && (
          <div>
            <Button
              className="button--orange"
              onClick={setModal.bind(this, { url: taxon.descriptionUrl })}
            >
              Les mer
            </Button>
          </div>
        )}

        {taxon.media &&
          (taxon.media.creators ||
            taxon.media.publishers ||
            taxon.media.license) && (
            <div>
              <hr style={{ marginTop: "3em" }} />
              <Typography
                variant="body2"
                style={{ fontSize: "1.3em" }}
                component="h2"
              >
                Bilde:
              </Typography>

              <ItemMetadata item={taxon.media} setModal={setModal} />
            </div>
          )}

        {!!followUpKeys.length && (
          <div>
            <hr style={{ marginTop: "3em" }} />
            <Typography variant="overline" component="p">
              Følgende {followUpKeys.length === 1 ? "nøkkel" : "nøkler"} kan
              brukes til å artsbestemme{" "}
              {taxon.vernacularName || taxon.scientificName} nærmere:
            </Typography>

            {followUpKeys.map((p) => (
              <KeyInfo key={p.id} keyItem={p} />
            ))}
          </div>
        )}
      </div>
    );
  } else if (modalObject.character || modalObject.alternative) {
    let content = modalObject.character || modalObject.alternative;

    if (
      content.descriptionUrl &&
      !(content.media || content.description || content.descriptionDetails)
    ) {
      setModal({ url: content.descriptionUrl });
    } else {
      modalContent = (
        <div style={{ margin: "25px" }}>
          {content.media && (
            <div>
              <img
                src={
                  (
                    content.media.mediaElement.find((m) => m.height >= 1280) ||
                    content.media.mediaElement[
                      content.media.mediaElement.length - 1
                    ]
                  ).url
                }
                style={{
                  maxHeight: "50vh",
                  maxWidth: "90vw",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
                alt={`Bilde: ${content.title}`}
              />
            </div>
          )}

          <Typography variant="h2" style={{ fontSize: "1.7em" }} component="h2">
            {content.title}
          </Typography>

          <Typography
            variant="body1"
            component="p"
            style={{ fontSize: "1.4em" }}
          >
            <b>{content.description}</b>
          </Typography>

          <Typography
            variant="body2"
            component="div"
            style={{ marginBottom: "3em", fontSize: "1.2em" }}
          >
            <ReactMarkdown source={content.descriptionDetails} />
          </Typography>
          {content.descriptionUrl && (
            <div>
              <Button
                className="button--orange"
                onClick={setModal.bind(this, { url: content.descriptionUrl })}
              >
                Les mer
              </Button>
            </div>
          )}

          {content.media &&
            (content.media.creators ||
              content.media.publishers ||
              content.media.license) && (
              <div>
                <hr style={{ marginTop: "3em" }} />
                <Typography
                  variant="body2"
                  style={{ fontSize: "1.3em" }}
                  component="h2"
                >
                  Bilde:
                </Typography>

                <ItemMetadata item={content.media} setModal={setModal} />
              </div>
            )}
        </div>
      );
    }
  }

  return (
    <Dialog
      aria-labelledby="dialog-title"
      open={!!modalContent}
      onClose={setModal.bind(this, {})}
      fullWidth={true}
      maxWidth="lg"
    >
      <DialogTitle id="simple-dialog-title">
        <IconButton
          aria-label="close"
          onClick={setModal.bind(this, {})}
          style={{ right: "15px", top: "0", position: "absolute" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{modalContent}</DialogContent>
    </Dialog>
  );
}

export default Modal;
