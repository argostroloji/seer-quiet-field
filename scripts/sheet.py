import sys
from PIL import Image
# usage: sheet.py in.png out.png [cols]
src=Image.open(sys.argv[1]); cols=int(sys.argv[3]) if len(sys.argv)>3 else 5
w,h=src.size; seg=-(-h//cols)
out=Image.new('RGB',(w*cols+20*(cols-1),seg),(40,40,40))
for i in range(cols):
    out.paste(src.crop((0,i*seg,w,min(h,(i+1)*seg))),(i*(w+20),0))
out.thumbnail((2400,2400)); out.save(sys.argv[2])
