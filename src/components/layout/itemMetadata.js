import React from "react";

const ItemMetadata = (props) => {
  const { item, modalOpener } = props;

  const getLicense = (url, width = 95) => {
    if (url.includes("creativecommons.org/publicdomain/zero/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="Licensed CC0"
          src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/cc-zero.png"
          onClick={modalOpener.bind(this, url, "url")}
        />
      );
    } else if (url.includes("creativecommons.org/licenses/by-sa/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="CC BY-SA"
          src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png"
          onClick={modalOpener.bind(this, url, "url")}
        />
      );
    } else if (url.includes("creativecommons.org/licenses/by/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="CC BY-SA"
          src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by.png"
          onClick={modalOpener.bind(this, url, "url")}
        />
      );
    } else if (url.includes("creativecommons.org/")) {
      url = (
        <img
          style={{ width, cursor: "pointer" }}
          alt="CC licensed"
          src="https://mirrors.creativecommons.org/presskit/cc.primary.srr.gif"
          onClick={modalOpener.bind(this, url, "url")}
        />
      );
    } else {
      url = <a href={url}>{url}</a>;
    }
    return url;
  };

  return (
    <div>
      {item.creators && (
        <div>
          Opphav:
          {item.creators.map((creator) => (
            <span
              onClick={
                creator.url && modalOpener.bind(this, creator.url, "url")
              }
              style={{
                paddingLeft: "15px",
                cursor: creator.url ? "pointer" : "default",
              }}
              key={creator.id}
            >
              {creator.name}
            </span>
          ))}
        </div>
      )}

      {item.contributors && (
        <div>
          Bidrag:
          {item.contributors.map((contributor) => (
            <span
              onClick={
                contributor.url &&
                modalOpener.bind(this, contributor.url, "url")
              }
              style={{
                paddingLeft: "10px",
                cursor: contributor.url ? "pointer" : "default",
              }}
              key={contributor.id}
            >
              {contributor.name}
            </span>
          ))}
        </div>
      )}

      {item.publishers && (
        <div>
          Utgiver:
          {item.publishers.map((publisher) => (
            <span
              onClick={
                publisher.url && modalOpener.bind(this, publisher.url, "url")
              }
              style={{
                paddingLeft: "10px",
                cursor: publisher.url ? "pointer" : "default",
              }}
              key={publisher.id}
            >
              {publisher.media ? (
                <img
                  alt={publisher.name}
                  src={publisher.media.mediaElement.url}
                  style={{ maxHeight: "25px", maxWidth: "200px" }}
                />
              ) : (
                <span>{publisher.name}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {item.infoUrl && (
        <div
          onClick={modalOpener.bind(this, item.infoUrl, "url")}
          style={{
            cursor: "pointer",
            color: "blue",
            textDecoration: "underline"
          }}
        >Mer om bildet</div>
      )}

      <div>{item.license && getLicense(item.license, 60)}</div>
    </div>
  );
};

export default ItemMetadata;
