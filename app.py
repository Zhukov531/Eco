from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from tortoise.contrib.fastapi import register_tortoise
from tortoise.expressions import Q, F
import time
from typing import Any, Optional, List, Union
from pydantic import BaseModel
from db import *
import asyncio
from tortoise.models import Model
app = FastAPI()




app.mount("/static", StaticFiles(directory="static"), name="static")

templ = Jinja2Templates(directory="templates")




register_tortoise(
    app,
    config={
    'connections': {
        'default': 'sqlite://database.db',
    },
    'apps': {
    'models': {
    'models': ['db'],
    'default_connection': 'default',
    }}},

    generate_schemas=True,
    add_exception_handlers=True)





# самое начало
@app.get("/", name='index')
async def root(request: Request):
    return templ.TemplateResponse('index.html', context={'request': request})

# профиль
@app.get("/profile", name='profile')
async def get_profile(request: Request):
    return templ.TemplateResponse('profile.html', context={'request': request})

# таски
@app.get("/tasks", name='tasks')
def get_tasks(request: Request):
    return templ.TemplateResponse('tasks.html', context={'request': request})

# друзья
@app.get("/friends", name='friends')
def get_friend(request: Request):
    return templ.TemplateResponse('friends.html', context={'request': request})
# апгрейды
@app.get("/upgrade", name='upgrade')
def get_upgrade(request: Request):
    return templ.TemplateResponse('upgrade.html', context={'request': request})

# получение топ юзеров
@app.get("/get_top")
async def get_user(limit: int = 100):
    user_ids = await Profile.all().limit(limit).order_by('-balance').values_list('user_id', flat=True)
    return JSONResponse(content={"user_ids": list(user_ids)})


# получение денных для гл страницы
@app.post("/user-data")
async def handle_user_data(request: Request):
    data = await request.json()
    user_id = data.get('user_id')

    prof, cc = await Profile.get_or_create(user_id=user_id)
    if cc:
        prof.user_id = user_id
        prof.name = data.get('name')
        await prof.save()
    if user_id:

        tree_level = prof.tree_lvl
        drop_count = prof.drop

        return JSONResponse(content={
            "success": True,
            "rating": await get_user_rank(user_id),
            "balance": prof.balance,
            "jeton": prof.jeton,
            "tree": tree_level,
            "drop": drop_count,
            "timer": prof.timer  
        }, status_code=200)
    else:
        return JSONResponse(content={"success": False}, status_code=400)

"""
профиль
rating - место в рейтинге
eco - кол-во токенов
jeton - кол-во жетонов
complet_task - кол-во выполненных задач
tree_count - кол-во деревьев
count_friend - кол-во друзей
"""

# получение данных для профиля
@app.post("/user-data-profile")
async def handle_user_profile(request: Request):
    data = await request.json()
    user_id = data.get('user_id')
    prof = await Profile.get(user_id=user_id)
    complet_task = await Task_game_User.filter(user_id=user_id).count()
    reff = await Profile.filter(ref=user_id).count()
    rank = await get_user_rank(user_id)
    if user_id:
        return JSONResponse(content={"success": True,
        'rating': rank,
        'eco': prof.balance,
        'jeton': prof.jeton,
        'complet_task': complet_task,
        'activ': 0,
        'compani': prof.compani,
        'tree_count': prof.tree_count,
        'count_friend': reff,
        }, status_code=200)
    else:
        return JSONResponse(content={"success": False}, status_code=400)


@app.post("/add-eco")
async def add_eco(request: Request):
    data = await request.json()
    user_id = data.get('user_id')
    amount = data.get('amount')

    user = await User.get(user_id=user_id)
    user.balance += amount
    await user.save()

    return JSONResponse(content={"success": True, "new_balance": user.balance}, status_code=200)


# получение массива тасков
@app.post('/get_tasks')
async def get_tasks(request: Request):
    data = await request.json()
    user_id = data.get('user_id')
    user = await User.get(user_id=user_id)
    tasks = await Task_game.filter(Q(lang='all') | Q(lang=user.lang)).all()
    tasks_list = []
    for task in tasks:
        ts = await Task_game_User.filter(user_id=user_id, task_id=task.id).first()
        if not ts:
            tasks_list.append({
                'id': task.id,
                'link': task.url,
                'img': task.img,
                'name': task.name,
                'price': task.price,
                'profit': task.profit })
    return JSONResponse(content={"success": True, "tasks": tasks_list}, status_code=200)

@app.post('/check_task', response_model=None)
async def check_task(request: Request):
    data = await request.json()
    user_id = data.get('user_id')
    task_id = data.get('task_id')

    user = await Profile.get(user_id=user_id)
    task = await Task_game.get(id=task_id)
    # После клика на задачу будет проверка подписки через 10 секунд
    await asyncio.sleep(10)
    await Task_game_User.create(user_id=user_id, task_id=task_id, time=time.time())
    user.balance += task.price * task.profit
    await user.save()
    
    return CheckTaskResponse(success=True, balance=user.balance)




# получается список друзей (приходит массив)
@app.get('/get_friends')
async def get_friends(user_id: int):
    user = await Profile.get(user_id=user_id)
    friends = await Profile.filter(ref=user_id).all()
    friends_list = [
        {"user_id": friend.user_id, "name": friend.name}
        for friend in friends
    ]
    return JSONResponse(content={"success": True, "list": friends_list}, status_code=200)

# name | type_upgrade | price | lvl | count
# получение апгрейдов (приходит массив)
@app.get('/get_upgrades')
async def get_upgrades(user_id: int):
   
    try:
        user_profile = await Profile.get(user_id=user_id)
    except:
        raise HTTPException(status_code=404, detail="User not found")

    upgrades = await Upgrade.all()
    available_upgrades = []

    for upgrade in upgrades:
        if upgrade.type_upgrade == 1 and upgrade.lvl > user_profile.profit_lvl:
            available_upgrades.append(upgrade)
        elif upgrade.type_upgrade == 2 and upgrade.lvl > user_profile.drop_max_lvl:
            available_upgrades.append(upgrade)
        elif upgrade.type_upgrade == 3 and upgrade.lvl > user_profile.speed_lvl:
            available_upgrades.append(upgrade)

    upgrades_list = [
        {
            "name": upgrade.name,
            "type_upgrade": upgrade.type_upgrade,
            "price": upgrade.price,
            "lvl": upgrade.lvl,
            "count": upgrade.count
        }
        for upgrade in available_upgrades
    ]

    return JSONResponse(content={"success": True, "upgrades": upgrades_list}, status_code=200)






# запрос на покупки апгрейда
@app.post('/click_upgrade')
async def click_upgrade(request: Request):
    data = await request.json()
    user_id = data.get('user_id')
    upgrade_id = data.get('upgrade_id')

    upgrade = await Upgrade.get(id=upgrade_id)
    user = await Profile.get(user_id=user_id)

    # Проверяе хватает ли баланса на апгрейд
    if user.balance < upgrade.price:
        return JSONResponse(content={"success": False, 
        "message": "Недостаточно средств"}, status_code=400)

    # Проверяем уровень апгрейда
    if upgrade.lvl >= 5:
        return JSONResponse(content={"success": False, 
        "message": "Уровень максимальный"}, status_code=400)

    user.balance -= upgrade.price
    if upgrade.type_upgrade == 1: 
        user.profit += upgrade.count
        user.profit_lvl += 1
    elif upgrade.type_upgrade == 2: 
        user.drop_max += upgrade.count
        user.drop_max_lvl += 1
    elif upgrade.type_upgrade == 3: 
        user.speed += upgrade.count
        user.speed_lvl += 1
    
    await user.save()
    return JSONResponse(content={"success": True}, status_code=200)




async def get_user_rank(user_id: int):
    user_profile = await Profile.get(user_id=user_id)
    rank = await Profile.filter(balance__gt=user_profile.balance).count() + 1
    return rank
