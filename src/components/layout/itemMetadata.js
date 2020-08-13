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
      {item.creator && (
        <span
          onClick={
            item.creator.url &&
            modalOpener.bind(this, item.creator.url, "url")
          }
          style={ item.creator.url && {cursor: "pointer"}}
        >
          {item.creator.name}
        </span>
      )}
      {item.contributor && (
        <span
          onClick={
            item.contributor.url &&
            modalOpener.bind(this, item.contributor.url, "url")
          }
          style={ item.contributor.url && {cursor: "pointer"}}

        >
          , {item.contributor.name}
        </span>
      )}
      {item.publisher && (
        <div
          onClick={
            item.publisher.url &&
            modalOpener.bind(this, item.publisher.url, "url")
          }
          style={item.publisher.url && { cursor: "pointer"}}
        >
          {item.publisher.media ? (
            <img
              alt={item.publisher.name}
              src={item.publisher.media.mediaElement.url}
              style={{ maxHeight: "25px", maxWidth: "200px" }}
            />
          ) : (
            <span>{item.publisher.name}</span>
          )}
        </div>
      )}
      {item.license && getLicense(item.license, 60)}
    </div>
  );
};

export default ItemMetadata;
