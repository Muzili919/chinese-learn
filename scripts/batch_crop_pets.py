#!/usr/bin/env python3
"""批量裁剪宠物精灵表 -> 27张独立PNG (保守去背v4)"""
import os, sys, shutil
import numpy as np
from PIL import Image
from collections import deque

BASE = "/Users/xiaolongmu/Downloads/文档"
OUT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets"
EMO = ["reading","sleeping","happy","sad_cry","angry","eating","wave","excited","normal"]
SF = ["1-9级.png","10-19级.png","20-40级.png"]

BG_PETS = [
    ("小仓鼠", BASE+"/n卡/小仓鼠", "hamster", True),
    ("小柯基", BASE+"/n卡/小柯基", "corgi", True),
    ("冰晶灵蝶", BASE+"/r卡/冰晶灵蝶", "butterfly", True),
    ("战镰螳螂", BASE+"/r卡/战镰螳螂", "mantis", True),
    ("机械松鼠", BASE+"/r卡/机械松鼠", "squirrel", True),
    ("功夫滚滚", BASE+"/r卡/功夫滚滚", "kungfu", True),
]
DARK_PETS = [("无牙仔", BASE+"/无牙仔", "toothless")]
TRANS_PETS = [
    ("小黄猫", BASE+"/n卡/小黄猫", "kitten",
     ["1-9级几个动作状态.png","10-19级几个动作状态.png","20-40级几个动作状态.png"]),
]
SEP = "=" * 60


def clean_dir(d):
    if not os.path.exists(d): return
    for f in os.listdir(d):
        if f.endswith(".png") and not f.startswith("._"):
            try: os.remove(os.path.join(d, f))
            except OSError: pass


def remove_bg_conservative(img):
    """
    超保守去背：只去除边缘与角落颜色几乎完全相同的纯背景像素
    绝不触碰任何可能属于主体的像素
    """
    img = img.convert("RGBA")
    data = np.array(img, dtype=np.float32)
    h, w = data.shape[:2]
    R, G, B = data[:,:,0], data[:,:,1], data[:,:,2]

    # 采样4个角确定背景色（安全边界）(y=row, x=col)
    mx = max(2, min(w, h) // 20)
    corners = [(mx, mx), (mx, w-mx), (h-mx, mx), (h-mx, w-mx)]
    bg_r = np.mean([R[y,x] for y,x in corners])
    bg_g = np.mean([G[y,x] for y,x in corners])
    bg_b = np.mean([B[y,x] for y,x in corners])

    # 非常严格的容差：RGB总差异 <= 15 才算背景
    TOL = 15

    visited = np.zeros((h,w), dtype=bool)
    bg_mask = np.zeros((h,w), dtype=bool)
    q = deque()

    # 四边全部入队
    for y in range(h):
        for x in [0, w-1]:
            q.append((y, x))
            visited[y, x] = True
    for x in range(w):
        for y in [0, h-1]:
            if not visited[y, x]:
                q.append((y, x))
                visited[y, x] = True

    dirs4 = [(-1,0), (1,0), (0,-1), (0,1)]
    while q:
        cy, cx = q.popleft()
        diff = abs(R[cy,cx]-bg_r) + abs(G[cy,cx]-bg_g) + abs(B[cy,cx]-bg_b)
        if diff <= TOL:
            bg_mask[cy, cx] = True
            for dy, dx in dirs4:
                ny, nx = cy+dy, cx+dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny,nx]:
                    visited[ny,nx] = True
                    q.append((ny, nx))

    # 输出
    out = data.copy().astype(np.uint8)
    out[bg_mask, 3] = 0
    return Image.fromarray(out)


def remove_bg_dark(img):
    """深色/黑色背景专用去背"""
    img = img.convert("RGBA")
    data = np.array(img, dtype=np.float32)
    h, w = data.shape[:2]
    R, G, B = data[:,:,0], data[:,:,1], data[:,:,2]

    TOL = 35

    visited = np.zeros((h,w), dtype=bool)
    bg_mask = np.zeros((h,w), dtype=bool)
    q = deque()

    for y in range(h):
        for x in [0, w-1]:
            q.append((y, x)); visited[y,x]=True
    for x in range(w):
        for y in [0, h-1]:
            if not visited[y,x]: q.append((y,x)); visited[y,x]=True

    dirs4 = [(-1,0),(1,0),(0,-1),(0,1)]
    while q:
        cy, cx = q.popleft()
        # 黑色背景判定：三个通道都较低
        if R[cy,cx] < TOL and G[cy,cx] < TOL*1.5 and B[cy,cx] < TOL*1.5:
            bg_mask[cy, cx] = True
            for dy,dx in dirs4:
                ny,nx=cy+dy,cx+dx
                if 0<=ny<h and 0<=nx<w and not visited[ny,nx]:
                    visited[ny,nx]=True; q.append((ny,nx))

    out = data.copy().astype(np.uint8)
    out[bg_mask, 3] = 0
    return Image.fromarray(out)


def rm_wm(img):
    img = img.convert("RGBA")
    d = np.array(img); h2, w2 = d.shape[:2]
    d[int(h2*0.86):h2, int(w2*0.78):w2, 3] = 0
    return Image.fromarray(d)


def crop3(src, dst, do_bg=False, do_wm=False, dark_bg=False):
    im = Image.open(src)
    iw, ih = im.size; cw, ch = iw//3, ih//3
    os.makedirs(dst, exist_ok=True)
    print(f"    {iw}x{ih} -> {cw}x{ch} each")
    fn_remove = remove_bg_dark if dark_bg else remove_bg_conservative
    for i, e in enumerate(EMO):
        row, col = divmod(i, 3)
        c = im.crop((col*cw, row*ch, (col+1)*cw, (row+1)*ch))
        if do_bg: c = fn_remove(c)
        if do_wm: c = rm_wm(c)
        p = os.path.join(dst, e+".png")
        c.save(p, "PNG")
        bb = c.getbbox()
        sz = (bb[2]-bb[0], bb[3]-bb[1]) if bb else (0,0)
        print(f"      OK {e}.png content {sz[0]}x{sz[1]}")


def main():
    print(SEP+"\nPet cropper v4 (conservative)\n"+SEP)

    for name, sdir, prefix, wm in BG_PETS:
        print("\n"+SEP+f"\n{name}\n"+SEP)
        for si, sf in enumerate(SF):
            sp = os.path.join(sdir, sf)
            od = os.path.join(OUT, prefix, "stage"+str(si+1))
            clean_dir(od)
            if os.path.exists(sp):
                print(f"\n  stage{si+1}: {sf}")
                crop3(sp, od, do_bg=True, do_wm=wm)

    for name, sdir, prefix in DARK_PETS:
        print("\n"+SEP+f"\n{name}\n"+SEP)
        s1f = "1-9级状态开心，闭眼，闭嘴，哭泣等.png"
        s1p = os.path.join(sdir, s1f); od = os.path.join(OUT, prefix, "stage1")
        clean_dir(od)
        if os.path.exists(s1p):
            print("\n  stage1"); crop3(s1p, od, do_bg=True, dark_bg=True)
        af = "第一排1-9级，第二排10-19级，第三排20-40级.png"
        ap = os.path.join(sdir, af)
        if os.path.exists(ap):
            print("\n  stage2+3")
            im2 = Image.open(ap); iw2,ih2 = im2.size; cw2=iw2//3; rh2=ih2//3
            for sn,ri in [("stage2",1),("stage3",2)]:
                od2 = os.path.join(OUT, prefix, sn); clean_dir(od2)
                os.makedirs(od2, exist_ok=True)
                print(f"  {sn} (row {ri})")
                for ci,em in enumerate(["reading","happy","normal"]):
                    c = im2.crop((ci*cw2,ri*rh2,(ci+1)*cw2,(ri+1)*rh2))
                    c = remove_bg_dark(c); op = os.path.join(od2, em+".png")
                    c.save(op,"PNG"); bb=c.getbbox()
                    sz=(bb[2]-bb[0],bb[3]-bb[1]) if bb else (0,0)
                    print(f"      OK {em}.png {sz[0]}x{sz[1]}")

    for name, sdir, prefix, flist in TRANS_PETS:
        print("\n"+SEP+f"\n{name}\n"+SEP)
        for si, sf in enumerate(flist):
            sp = os.path.join(sdir, sf)
            od = os.path.join(OUT, prefix, "stage"+str(si+1)); clean_dir(od)
            if os.path.exists(sp): print(f"\n  stage{si+1}: {sf}"); crop3(sp, od)

    print("\n"+SEP+"\n紫柴犬->shiba\n"+SEP)
    sbs = BASE+"/n卡/紫柴犬"; sbd = os.path.join(OUT,"shiba")
    bk = sbd+"_backup"
    if os.path.exists(sbd) and not os.path.exists(bk): shutil.move(sbd,bk); print("  backup")
    for si,(sn,fd) in enumerate(zip(["stage1","stage2","stage3"],["1-9级","10-19级","20-40级"])):
        sf=os.path.join(sbs,fd); df=os.path.join(sbd,sn)
        if not os.path.exists(sf): continue
        if os.path.exists(df): shutil.rmtree(df)
        os.makedirs(df)
        fl=sorted([f for f in os.listdir(sf) if f.endswith(".png")])
        for i,fn in enumerate(fl):
            if i>=9: break
            shutil.copy2(os.path.join(sf,fn), os.path.join(df,EMO[i]+".png"))
        print(f"  OK {sn}: {min(len(fl),9)}")

    print("\nDone!"); total=0
    for dn in sorted(os.listdir(OUT)):
        dp=os.path.join(OUT,dn)
        if not os.path.isdir(dp) or dn.startswith(".") or "backup" in dn: continue
        c=sum(len([f for f in os.listdir(sd) if f.endswith(".png")]) for sd,_,_ in os.walk(dp))
        total+=c; print(f"  {dn}: {c}")
    print(f"\nTotal: {total}")

if __name__=="__main__":
    main()
