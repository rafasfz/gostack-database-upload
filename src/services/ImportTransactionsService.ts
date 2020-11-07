import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

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
      const [title, type, valueString, category] = line;
      const value = Number(valueString);

      const transactionsRepository = getCustomRepository(
        TransactionsRepository,
      );
      const categoriesRepository = getRepository(Category);

      const balance = await transactionsRepository.getBalance();
      const totalBalance = balance.total;

      if (type === 'outcome' && value > totalBalance) {
        throw new AppError('Can not outcome more than total balance.');
      }

      const checkCategoryExist = await categoriesRepository.findOne({
        where: { title: category },
      });

      if (!checkCategoryExist) {
        const newCategory = categoriesRepository.create({
          title: category,
        });

        await categoriesRepository.save(newCategory);
      }

      const transactionCategory = (await categoriesRepository.findOne({
        where: { title: category },
      })) as Category;

      const transaction = transactionsRepository.create({
        title,
        value,
        type,
        category_id: transactionCategory,
      });

      await transactionsRepository.save(transaction);

      transactions.push(transaction);
      console.log(transaction);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    return transactions;
  }
}

export default ImportTransactionsService;
