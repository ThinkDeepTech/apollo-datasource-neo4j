import {attachExitHandler} from '@thinkdeep/attach-exit-handler';
import {DataSource} from 'apollo-datasource';
import neo4j from 'neo4j-driver';

/**
 * Apollo neo4j data source.
 */
class Neo4jDataSource extends DataSource {
  /**
   * Constructor.
   * @param {Object} context Context for the neo4j connection of the structure
   * {
   *    url: <neo4j url>,
   *    authToken: <neo4j driver auth token value>,
   *    defaultDatabase: <database>,
   *    defaultAccessMode: neo4j.session.READ
   * }
   */
  constructor(context) {
    super();

    this.context = context;

    this.neo4j = neo4j;

    const url = context.url;
    if (!url) {
      throw new Error(`The specified url was invalid: ${url}`);
    }

    const authToken = context.authToken;
    this.driver = this._driver(url, authToken);
  }

  /**
   * Initialize the data source.
   * @param {Object} config Configuration for apollo datasource.
   */
  async initialize(config) {
    this.context = config.context;
  }

  /**
   * Run a query against neo4j.
   * @param {String} query Neo4j query string.
   * @param {Object} params Variables to include in the query.
   * @param {Object} options Query options.
   * @return {Object} Result of the query or null;
   */
  async run(
    query,
    params,
    options = {
      database: this.context.defaultDatabase,
      accessMode: this.context.defaultAccessMode || neo4j.session.READ,
    }
  ) {
    await this.driver.verifyConnectivity();

    const session = this.driver.session({
      database: options.database,
      defaultAccessMode: options.accessMode,
    });

    let results = null;
    try {
      results = session.run(query, params);
    } finally {
      await session.close();
    }

    return results;
  }

  /**
   * Get a neo4j driver.
   * @param {String} url Neo4j url.
   * @param {Object} authToken Auth object obtained from the drivers neo4j.auth.basic(...), etc.
   * @return {Object} Neo4j driver.
   */
  _driver(url, authToken) {
    const dvr = neo4j.driver(url, authToken, {
      disableLosslessIntegers: true,
    });
    attachExitHandler(async () => {
      await dvr.close();
    });

    return dvr;
  }
}

export {Neo4jDataSource};
