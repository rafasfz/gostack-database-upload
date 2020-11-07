import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface TransactionData {
  title: string;
  value: number;
  type: 'outcome' | 'income';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const transactionsData = await this.readCsv(filename);

    /* for (let i = 0; i < transactionsData.length; i += 1) {
      const { category, title, type, value } = transactionsData[i];
      const createTransaction = new CreateTransactionService();

      const transaction = createTransaction.execute({
        title,
        type: type as 'income' | 'outcome',
        value,
        category,
      });
      transactionsPromise.push(transaction);
    } */

    const transactions: Transaction[] = [];

    await transactionsData.reduce(async (previousPromise, currArg) => {
      await previousPromise;
      const { category, title, type, value } = currArg;
      const createTransaction = new CreateTransactionService();
      const transaction = await createTransaction.execute({
        title,
        type: type as 'income' | 'outcome',
        value,
        category,
      });
      transactions.push(transaction);
    }, Promise.resolve());

    // const transactions: Transaction[] = await Promise.all(transactionsPromise);
    return transactions;
  }

  async readCsv(filename: string): Promise<TransactionData[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsData: TransactionData[] = [];

    parseCSV.on('data', line => {
      const [title, type, valueString, category] = line;
      const value = Number(valueString);
      transactionsData.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return transactionsData;
  }
}

export default ImportTransactionsService;
