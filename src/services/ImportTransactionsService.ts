import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: Transaction[] = [];

    parseCSV.on('data', async line => {
      const createTransaction = new CreateTransactionService();

      const transaction = await createTransaction.execute({
        title: line[0],
        type: line[1],
        value: Number(line[2]),
        category: line[3],
      });
      transactions.push(transaction);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    return transactions;
  }
}

export default ImportTransactionsService;
