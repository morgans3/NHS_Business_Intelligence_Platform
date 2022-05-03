# Data Library and Initial Dataset deployment

Included in this folder is code for managing the data library of the NHS BI Platform.

For functionality to administer the backend, please review the code in: <https://github.com/morgans3/NHS_Business_Intelligence_Platform_Backend>

## Usage

The main command to run the deployment of all the datasets is `npm run deploy-data`, as per the full platform deployment guide.

However, there are additional commands to run specific parts of the data deployment:

- `npm run deploy-data-dynamodb`: Deploys only the DynamoDB datasets to your AWS database.
- `npm run deploy-data-postgresql`: Deploys only the Postgresql datasets to your AWS database.
- `npm run remove-data`: Removes all the data from your AWS databases.
- `npm run remove-tables`: Removes all the datasets and their tables from your AWS databases.

## Split of Datasets

To support the platform we have both a non-relational database (DynamoDB) and a relational database (PostgreSQL).

DynamoDB is extremely quick and useful for transactional data. Postgresql is a relational database that is more suitable for data where you need to link data together or where you need to run aggregations.

## DynamoDB Datasets

### Table Keys and Indexes

The list of tables and their schemas can be found in the folder `dynamodb/backup_schemas/`.

### Minimum Required Datasets

Datasets for minimal functionality of the platform are available in the folder `dynamodb/backup_data/`.

## PostgreSQL Datasets

### Table Schemas

The list of tables and their schemas can be found in the file `postgresql/backup_data/shemas.json`.

### Available Data

For the tables that we have publicly available data such as geographies or locations, we have included csv files with our current development dataset. Adding these will ensure that the applications run as expected.

As we predominantly deal with Lancashire & South Cumbria, we have included the information required for this area. If you would like to explore different areas for data or would like to know how we obtain this information, please contact us.
