import {DataSource} from 'apollo-datasource';

/**
 * Apollo neo4j data source.
 */
class Neo4jDataSource extends DataSource {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.context = {};
  }

  /**
   * Initialize the data source.
   * @param {Object} config Configuration object.
   */
  initialize(config) {
    this.context = config.context || {};
  }
}

export {Neo4jDataSource};
