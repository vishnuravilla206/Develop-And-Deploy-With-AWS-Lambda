import AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient()

const todosTable = process.env.TODOS_TABLE
const createdAtIndex = process.env.TODOS_CREATED_AT_INDEX

export async function getTodos(userId) {
  const result = await docClient
    .query({
      TableName: todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
    .promise()

  return result.Items
}

export async function createTodoItem(todoItem) {
  await docClient
    .put({
      TableName: todosTable,
      Item: todoItem
    })
    .promise()

  return todoItem
}

export async function updateTodoItem(userId, todoId, updatedFields) {
  const updateParts = []
  const ExpressionAttributeNames = {}
  const ExpressionAttributeValues = {}

  if (updatedFields.name !== undefined) {
    updateParts.push('#name = :name')
    ExpressionAttributeNames['#name'] = 'name'
    ExpressionAttributeValues[':name'] = updatedFields.name
  }

  if (updatedFields.dueDate !== undefined) {
    updateParts.push('dueDate = :dueDate')
    ExpressionAttributeValues[':dueDate'] = updatedFields.dueDate
  }

  if (updatedFields.done !== undefined) {
    updateParts.push('done = :done')
    ExpressionAttributeValues[':done'] = updatedFields.done
  }

  if (updateParts.length === 0) return null

  const result = await docClient
    .update({
      TableName: todosTable,
      Key: { userId, todoId },
      UpdateExpression: 'set ' + updateParts.join(', '),
      ExpressionAttributeNames:
        Object.keys(ExpressionAttributeNames).length > 0
          ? ExpressionAttributeNames
          : undefined,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    })
    .promise()

  return result.Attributes
}

export async function deleteTodoItem(userId, todoId) {
  await docClient
    .delete({
      TableName: todosTable,
      Key: { userId, todoId }
    })
    .promise()
}

export async function setAttachmentUrl(userId, todoId, attachmentUrl) {
  await docClient
    .update({
      TableName: todosTable,
      Key: { userId, todoId },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    })
    .promise()
}
