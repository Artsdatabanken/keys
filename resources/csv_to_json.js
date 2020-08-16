// Reads a higly standardized, old csv file and outputs json in new format

const fs = require("fs");
const axios = require("axios");

const simplify = (statements, taxa) => {
  for (const taxon of taxa) {
    // continue if it has no children
    if (!taxon.children) {
      continue;
    }

    statements = simplify(statements, taxon.children);

    // for all statements for the first child
    let myStatements = statements.filter(
      (s) => s.taxonId === taxon.children[0].id
    );

    let siblingIds = taxon.children.map((x) => x.id).slice(1);

    for (const myStatement of myStatements) {
      let foundDifference = false;
      // find the same statement for each next child
      // continue when not found
      for (const siblingId of siblingIds) {
        if (
          !statements.find(
            (x) =>
              x.taxonId === siblingId &&
              x.value === myStatement.value &&
              x.frequency === myStatement.frequency
          )
        ) {
          foundDifference = true;
          break;
        }
      }

      if (!foundDifference) {
        // otherwise they are all the same
        // set simplified to true

        myStatement.taxonId = taxon.id;

        myStatement.id =
          taxon.id.replace("taxon:", "statement:") +
          myStatement.value.replace("alternative:", "_");
        // statements.push(myStatement);

        statements = statements.filter(
          (x) =>
            !(
              x.value === myStatement.value &&
              taxon.children.map((y) => y.id).includes(x.taxonId)
            )
        );
      }
    }
  }

  return statements;
};

const supplementTaxa = async (taxa) => {
  for (let index = 0; index < taxa.length; index++) {
    let taxon = taxa[index];
    if (
      taxon.externalReference &&
      (!taxon.scientificName || !taxon.vernacularName)
    ) {
      console.log("Fetching name...");
      let taxonResult = await axios.get(
        "https://artsdatabanken.no/api/Resource/?Take=1&Type=Taxon&AcceptedNameUsage=" +
          taxon.externalReference.externalId
      );

      if (taxonResult.data.length) {
        taxa[index].scientificName =
          taxa[index].scientificName ||
          taxonResult.data[0].AcceptedNameUsage.ScientificName;
        taxa[index].vernacularName =
          taxa[index].vernacularName ||
          taxonResult.data[0]["VernacularName_nb-NO"][0] ||
          undefined;
        if (taxonResult.data[0].Description) {
          taxa[index].descriptionUrl =
            taxa[index].descriptionUrl ||
            taxonResult.data[0].Description[0].Id.replace(
              "Nodes/",
              "https://artsdatabanken.no/Widgets/"
            );
        }
      }
    }

    if (taxa[index].children) {
      taxa[index].children = await supplementTaxa(taxa[index].children);
    }

    if (!taxa[index].id) {
      taxa[index].id =
        taxa[index].scientificName &&
        "taxon:" + taxa[index].scientificName.replace(/\s+/g, "").toLowerCase();
    }
  }
  return taxa;
};

const mergeTaxon = (taxon, taxa) => {
  for (let index = 0; index < taxa.length; index++) {
    if (
      (taxa[index].externalReference &&
        taxon.externalReference &&
        taxa[index].externalReference.externalId ===
          taxon.externalReference.externalId) ||
      (taxa[index].id && taxon.id && taxa[index].id === taxon.id)
    ) {
      taxa[index].children = mergeTaxon(
        taxon.children[0],
        taxa[index].children
      );
      return taxa;
    }
  }

  taxa.push(taxon);
  return taxa;
};

const getMedia = (mediaInfo, mediaElements, persons, organizations) => {
  mediaElements = mediaElements || [];
  output = mediaInfo[0] ? "media:media" + mediaInfo[0] : undefined;

  if (output && !mediaElements.find((x) => x.id === output)) {
    let mediaElement = {
      id: output,
      infoUrl: "https://artsdatabanken.no/Widgets/" + mediaInfo[0] || undefined,
      license: mediaInfo[1] || undefined,
      mediaElement: [
        {
          url:
            "https://artsdatabanken.no/Media/" + mediaInfo[0] + "?mode=128x128",
          width: 128,
          height: 128,
        },
        {
          url:
            "https://artsdatabanken.no/Media/" +
            mediaInfo[0] +
            "?mode=1024x1024",
          width: 1024,
          height: 1024,
        },
      ],
    };

    [mediaElement.creators, persons] = getResources(
      mediaInfo[2],
      persons,
      "person"
    );
    [mediaElement.contributors, persons] = getResources(
      mediaInfo[3],
      persons,
      "person"
    );
    [mediaElement.publishers, organizations] = getResources(
      mediaInfo[4],
      organizations,
      "organization"
    );

    mediaElements.push(mediaElement);
  }

  return [output, mediaElements, persons, organizations];
};

const getResources = (resourceString, targetArray, type) => {
  targetArray = targetArray || [];
  resourceString = resourceString || "";

  let resourceStrings = resourceString.split("|").map((x) => x.trim());

  let output = [];

  resourceStrings
    .filter((x) => x.length)
    .forEach((resourceString) => {
      let resource = targetArray.find((x) => x.name === resourceString);

      if (!resource) {
        resource = {
          id: type + ":" + resourceString.replace(/\s+/g, "").toLowerCase(),
          name: resourceString,
        };

        targetArray.push(resource);
      }

      output.push(resource.id);
    });

  return [
    output.length ? output : undefined,
    targetArray.length ? targetArray : undefined,
  ];
};

let csv;
let key = {
  $schema:
    "https://raw.githubusercontent.com/Artsdatabanken/identification_key_schema/f886188c5c285d7eaabb7b8adffc97c106772cbe/Identification_key_schema.json",
};

key.externalServices = [
  {
    id: "service:nbic_scientificnameid",
    title: "ScientificNameId in Artsnavnebasen",
    provider: "Norwegian Biodiversity I…Centre (Artsdatabanken)",
    url: "https://artsdatabanken.no/Api/Taxon/ScientificName/",
  },
];

fs.readFile("key.csv", "utf-8", (err, data) => {
  if (err) throw err;
  csv = data.split("\n").map((x) => x.split("\t"));

  const definitions = {
    metadataRows: [],
    characterCols: [],
    taxonRows: [],
  };

  let i = 0;
  while (csv[i][0] !== "Character") {
    if (csv[i][0]) {
      definitions.metadataRows.push(csv[i][0]);
    }
    i++;
  }

  let j = 0;

  while (csv[i][j]) {
    definitions.characterCols.push(csv[i][j]);
    j++;
  }

  k = 0;
  while (k < i && csv[k][j]) {
    definitions.taxonRows.push(csv[k][j]);
    k++;
  }

  [key.creators, key.persons] = getResources(
    csv[definitions.metadataRows.indexOf("Key creators")][1],
    key.persons,
    "person"
  );

  [key.contributors, key.persons] = getResources(
    csv[definitions.metadataRows.indexOf("Key contributors")][1],
    key.persons,
    "person"
  );

  [key.publishers, key.organizations] = getResources(
    csv[definitions.metadataRows.indexOf("Key publishers")][1],
    key.organizations,
    "organization"
  );

  key["id"] =
    csv[definitions.metadataRows.indexOf("Key id")][1] || undefined;
  key["title"] =
    csv[definitions.metadataRows.indexOf("Key name")][1] || undefined;
  key["description"] =
    csv[definitions.metadataRows.indexOf("Key intro")][1] || undefined;
  key["descriptionUrl"] =
    csv[definitions.metadataRows.indexOf("Key description")][1] || undefined;
  key["language"] =
    csv[definitions.metadataRows.indexOf("Language")][1] || undefined;
  key["license"] =
    csv[definitions.metadataRows.indexOf("Key license")][1] || undefined;
  key["regionName"] =
    csv[definitions.metadataRows.indexOf("Geographic range")][1] || undefined;

  if (key["descriptionUrl"]) {
    key["descriptionUrl"] =
      "https://artsdatabanken.no/Widgets/" + key["descriptionUrl"];
  }

  key.characters = [];
  key.characterIds = [];
  key.stateIds = [];

  csv
    .slice(
      Math.max(definitions.metadataRows.length, definitions.taxonRows.length) +
        1
    )
    .forEach((row) => {
      if (row[definitions.characterCols.indexOf("Character")]) {
        key.characters.push({
          id: "character:character" + (key.characters.length + 1),
          title: row[definitions.characterCols.indexOf("Character")],
          logicalPremise: row[
            definitions.characterCols.indexOf("Character requirement")
          ]
            ? row[definitions.characterCols.indexOf("Character requirement")]
                .replace("{", "alternative:")
                .replace("}", "")
            : undefined,
          descriptionUrl: row[definitions.characterCols.indexOf("Description")]
            ? "https://artsdatabanken.no/Widgets/" +
              row[definitions.characterCols.indexOf("Description")]
            : undefined,
          alternatives: [],
        });
      }

      if (row[definitions.characterCols.indexOf("State")]) {
        let state = {
          id:
            "alternative:" +
            (row[definitions.characterCols.indexOf("State id")] ||
              "alternative" +
                key.characters.length +
                "_" +
                (key.characters[key.characters.length - 1].alternatives.length +
                  1)),
          title: row[definitions.characterCols.indexOf("State")],
          media: [
            row[definitions.characterCols.indexOf("State media")],
            row[definitions.characterCols.indexOf("State media license")],
            row[definitions.characterCols.indexOf("State media creators")],
            row[definitions.characterCols.indexOf("State media contributors")],
            row[definitions.characterCols.indexOf("State media publishers")],
          ],
        };

        [
          state.media,
          key.mediaElements,
          key.persons,
          key.organizations,
        ] = getMedia(
          state.media,
          key.mediaElements,
          key.persons,
          key.organizations
        );

        key.characters[key.characters.length - 1].alternatives.push(state);
        key.characterIds.push(key.characters[key.characters.length - 1].id);
        key.stateIds.push(state.id);
      }
    });

  key.taxa = [];
  key.taxonIds = [];

  for (let i = definitions.characterCols.length + 1; i < csv[0].length; i++) {
    let taxon;

    if (csv[definitions.taxonRows.indexOf("Morph")][i]) {
      taxon = {
        id:
          "taxon:" +
          csv[definitions.taxonRows.indexOf("Name")][i]
            .replace(/\s+/g, "")
            .toLowerCase() +
          (csv[definitions.taxonRows.indexOf("Subset")][i] &&
            "_" + csv[definitions.taxonRows.indexOf("Subset")][i]) +
          (csv[definitions.taxonRows.indexOf("Morph")][i] &&
            "_" + csv[definitions.taxonRows.indexOf("Morph")][i]),

        vernacularName: csv[definitions.taxonRows.indexOf("Morph")][i],
        media: [
          csv[definitions.taxonRows.indexOf("Media")][i],
          csv[definitions.taxonRows.indexOf("Media license")][i],
          csv[definitions.taxonRows.indexOf("Media creators")][i],
          csv[definitions.taxonRows.indexOf("Media contributors")][i],
          csv[definitions.taxonRows.indexOf("Media publishers")][i],
        ],
      };

      [
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations,
      ] = getMedia(
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations
      );

      key.taxonIds.push(taxon.id);
    }

    if (csv[definitions.taxonRows.indexOf("Subset")][i]) {
      if (taxon) {
        taxon = { children: [taxon], isResult: true };
      } else {
        taxon = {};
      }

      taxon.id =
        "taxon:" +
        csv[definitions.taxonRows.indexOf("Name")][i]
          .replace(/\s+/g, "")
          .toLowerCase() +
        (csv[definitions.taxonRows.indexOf("Subset")][i] &&
          "_" + csv[definitions.taxonRows.indexOf("Subset")][i]);

      taxon.vernacularName = csv[definitions.taxonRows.indexOf("Subset")][i];

      if (!taxon.children) {
        key.taxonIds.push(taxon.id);

        taxon.media = [
          csv[definitions.taxonRows.indexOf("Media")][i],
          csv[definitions.taxonRows.indexOf("Media license")][i],
          csv[definitions.taxonRows.indexOf("Media creators")][i],
          csv[definitions.taxonRows.indexOf("Media contributors")][i],
          csv[definitions.taxonRows.indexOf("Media publishers")][i],
        ];

        [
          taxon.media,
          key.mediaElements,
          key.persons,
          key.organizations,
        ] = getMedia(
          taxon.media,
          key.mediaElements,
          key.persons,
          key.organizations
        );
      }
    }

    if (taxon) {
      taxon = { children: [taxon] };
      if (!csv[definitions.taxonRows.indexOf("Subset")][i]) {
        taxon.isResult = true;
      }
    } else {
      taxon = {};
    }

    taxon.id =
      "taxon:" +
      csv[definitions.taxonRows.indexOf("Name")][i]
        .replace(/\s+/g, "")
        .toLowerCase();

    taxon.vernacularName = csv[definitions.taxonRows.indexOf("Vernacular")][i];
    taxon.scientificName = csv[definitions.taxonRows.indexOf("Name")][i];

    taxon.externalReference = {
      serviceId: "service:nbic_scientificnameid",
      externalId: csv[definitions.taxonRows.indexOf("ScientificNameID")][i],
    };

    if (!taxon.children) {
      taxonIds.push(taxon.id);

      taxon.media = [
        csv[definitions.taxonRows.indexOf("Media")][i],
        csv[definitions.taxonRows.indexOf("Media license")][i],
        csv[definitions.taxonRows.indexOf("Media creators")][i],
        csv[definitions.taxonRows.indexOf("Media contributors")][i],
        csv[definitions.taxonRows.indexOf("Media publishers")][i],
      ];

      [
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations,
      ] = getMedia(
        taxon.media,
        key.mediaElements,
        key.persons,
        key.organizations
      );
    }

    let parents = csv[definitions.taxonRows.indexOf("Taxon path")][i]
      .split("|")
      .map((x) => x.trim());

    while (parents.length && parents[parents.length - 1]) {
      taxon = {
        externalReference: {
          serviceId: "service:nbic_scientificnameid",
          externalId: parents[parents.length - 1],
        },
        children: [taxon],
      };
      parents.pop();
    }

    key.taxa = mergeTaxon(taxon, key.taxa);
  }

  const facts = csv
    .slice(definitions.taxonRows.length + 1)
    .map((x) => x.slice(definitions.characterCols.length + 1))
    .filter((x) => x.length);

  key.statements = [];

  facts.forEach((row, stateIndex) => {
    row.forEach((fact, taxonIndex) => {
      if (+fact) {
        key.statements.push({
          id:
            "statement:" +
            key.taxonIds[taxonIndex].replace("taxon:", "") +
            "_" +
            key.stateIds[stateIndex].replace("alternative:", ""),
          taxonId: key.taxonIds[taxonIndex],
          characterId: key.characterIds[stateIndex],
          value: key.stateIds[stateIndex],
          frequency: +fact !== 1 ? fact : undefined,
        });
      }
    });
  });

  key.taxa = supplementTaxa(key.taxa).then((taxa) => {
    console.log(key.statements.length);
    key.statements = simplify(key.statements, taxa);
    console.log(key.statements.length);

    fs.writeFile(
      "output.json",
      JSON.stringify({
        $schema: key.$schema,
        id: key.id,
        title: key.title,
        description: key.description,
        descriptionDetails: key.descriptionDetails,
        descriptionUrl: key.descriptionUrl,
        language: key.language,
        license: key.license,
        regionName: key.regionName,
        creators: key.creators,
        contributors: key.contributors,
        publishers: key.publishers,
        created: key.created,
        lastModified: key.lastModified,
        persons: key.persons,
        organizations: key.organizations,
        externalServices: key.externalServices,
        mediaElements: key.mediaElements,
        taxa: taxa,
        characters: key.characters,
        statements: key.statements,
      }),
      "utf-8",
      (err) => {
        if (err) throw err;
        console.log("Done");
      }
    );
  });
});
