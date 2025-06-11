
import sys, os, zipfile, csv
import tkinter as tk
from tkinter import filedialog

if len(sys.argv) < 2:
    root = tk.Tk()
    root.withdraw()
    data_path = filedialog.askopenfilename(title='Select data (.zip file) to parse')
    if data_path == '':
        sys.exit('No data file selected')
else:
    data_path = sys.argv[1]

 #data_path = r"C:\Users\isaac\Downloads\jatos_results_data_20250326194956.zip"

# unzip if necessary
if data_path.endswith('.zip'):
    print('Zipped file detected.')
    unzip_destination = data_path[:-4] # rather than .replace(".zip", "") because technically you could have .zip in a higher level of the folder hierarchy
    with zipfile.ZipFile(data_path, 'r') as zf:
        # extracting all the files 
        print('Extracting to %s...' % unzip_destination) 
        zf.extractall(path=unzip_destination) 
        print('Done!')
    data_path = unzip_destination

# traverse and parse
tables_by_phase = {'rating': [], 'writing': []}
ptpts = os.listdir(data_path)
for ptpt in ptpts:
    ptpt_dir = os.path.join(data_path, ptpt)
    comps = os.listdir(ptpt_dir)
    for comp in comps:
        comp_dir = os.path.join(ptpt_dir, comp)
        data_file = os.path.join(comp_dir, 'data.txt')
        if os.path.exists(data_file):
            # read file
            rows = list(csv.DictReader(open(data_file)))
            # get experiment phase
            expt_phase = rows[0]['expt_phase']
            tables_by_phase[expt_phase] += rows
        else:
            print('data.txt does not exist within %s for %s' % (comp, ptpt))

# write csv files
parsed_path = data_path + '_parsed'
if not os.path.exists(parsed_path):
    os.mkdir(parsed_path)
for expt_phase in tables_by_phase:
    data = tables_by_phase[expt_phase]
    csv_file = os.path.join(parsed_path, '%s.csv' % expt_phase)
    with open(csv_file, 'w', newline='') as csvfile:
        print('Writing %s...' % csv_file)
        cols = [k for k in data[0]]
        writer = csv.DictWriter(csvfile, fieldnames=cols)
        writer.writeheader()
        writer.writerows(data)
        print('Done!')

print('Finished parsing!')
input('Press enter to close')