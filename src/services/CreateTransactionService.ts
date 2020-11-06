import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'outcome' | 'income';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
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

    return transaction;
  }
}

export default CreateTransactionService;
