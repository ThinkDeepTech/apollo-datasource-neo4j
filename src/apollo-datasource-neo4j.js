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
   * @param {Object} accessMode Access mode for query.
   * @param {String} database Database against which query will be executed.
   * @return {Object} Result of the query or null;
   */
  async run(
    query,
    params,
    accessMode = this.context.defaultAccessMode || neo4j.session.READ,
    database = this.context.defaultDatabase || 'neo4j'
  ) {
    await this._verifyConnectivity(this.driver);

    const session = this.driver.session({
      database,
      defaultAccessMode: accessMode,
    });

    let results = null;
    try {
      results = await session.run(query, params);
    } catch (e) {
      console.error(`Failed to run query: ${e.message}\n${query}\n`);
      throw e;
    } finally {
      await session.close();
    }

    return results;
  }

  /**
   * Verify that a successfull connection was made with neo4j.
   *
   * @param {Object} driver Neo4j driver.
   */
  async _verifyConnectivity(driver) {
    try {
      await driver.verifyConnectivity();
      console.debug(`Neo4j driver connected successfully.`);
    } catch (e) {
      console.error(`Neo4j driver failed to connect. ${e.message}`);
      throw e;
    }
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
      console.debug(`Closing neo4j driver.`);
      await dvr.close();
    });

    return dvr;
  }
}

export {Neo4jDataSource};
