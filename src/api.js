import axios from 'axios';
import Papa from 'papaparse';

export const fetchDataFromGoogleSheets = async () => {
    const response = await axios.get('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_J5NexKCOcM45rX8pVcCEnNRPi4Fa7TLgrIDD911PQn0byNNvIk1NZ27gD5sybbd4AfAuhaLHRh9x/pub?output=csv');
    const parsedData = Papa.parse(response.data, { header: true }).data;
    return parsedData;
};