from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator
from datetime import datetime




class BaseModel(models.Model):
    id = fields.IntField(pk=True)

    class Meta:
        abstract = True

class Img_Lang(BaseModel):
    menu = fields.TextField()
    text = fields.TextField()
    lang = fields.CharField(max_length=2)

class Text_Lang(BaseModel):
    menu = fields.TextField()
    text = fields.TextField()
    lang = fields.CharField(max_length=2)

class User(BaseModel):
    user_id = fields.IntField(unique=True)
    data_reg = fields.DateField(default=datetime.now)
    balance = fields.IntField(default=0)
    ref = fields.IntField(null=True)
    adres = fields.TextField(null=True)
    lang = fields.CharField(max_length=2, default='ru')
    data_bonus = fields.IntField(null=True)
    old = fields.IntField(default=0)
    

class Server(BaseModel):
    status_sub = fields.BooleanField(default=False)

class Sub_list(BaseModel):
    channel_id = fields.IntField()
    url = fields.TextField()
    name = fields.TextField()
    count = fields.IntField(default=0)

class Task(BaseModel):
    price = fields.IntField()
    url = fields.TextField()
    channel_id = fields.IntField()
    data_reg = fields.DateField()
    name = fields.TextField()
    name_user = fields.TextField(null=True)
    lang = fields.CharField(max_length=3, default='all') # ru en all
    sub = fields.BooleanField(default=True)
    caption = fields.TextField(default='0')
    hiden = fields.BooleanField(default=0)

class Task_User(BaseModel):
    task_id = fields.IntField()
    user_id = fields.IntField()
    status = fields.BooleanField()



class Profile(BaseModel):
    user_id = fields.IntField()
    name = fields.TextField()
    tree_lvl =  fields.IntField(default=0) # уровени дерева
    tree_count = fields.IntField(default=0) # кол-во деревьев
    time = fields.IntField(default=0) # время последнего полив
    # procent = fields.IntField(default=0) # процент
    # boost = fields.IntField(default=0)
    # procent_lvl = fields.IntField(default=0)
    # boost_lvl = fields.IntField(default=0)
    
class Company(BaseModel):
    name = fields.TextField()
    count_user = fields.IntField()


class upgrade(BaseModel):
    name = fields.TextField() # название
    price = fields.IntField() # цена
    lvl = fields.IntField() # уровень
    procent = fields.IntField() # на сколько процентов действует улучшение
    